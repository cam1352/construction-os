import {
  IAgent,
  AgentMetadata,
  AgentFactory,
  AgentConstructor,
} from "./types.js";

interface RegistryEntry {
  factory: AgentFactory;
  metadata: AgentMetadata;
}

export class AgentRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentRegistryError";
  }
}

/**
 * Singleton registry for dynamic agent discovery, registration, and instantiation.
 */
export class AgentRegistry {
  private static instance: AgentRegistry | null = null;
  private readonly entries = new Map<string, RegistryEntry>();

  private constructor() {}

  /**
   * Retrieves the global AgentRegistry singleton instance.
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Resets the singleton instance (primarily used for unit test isolation).
   */
  public static resetInstance(): void {
    if (AgentRegistry.instance) {
      AgentRegistry.instance.entries.clear();
      AgentRegistry.instance = null;
    }
  }

  /**
   * Registers an agent class or factory under a unique type key.
   */
  public register(
    agentType: string,
    factoryOrConstructor: AgentFactory | AgentConstructor,
    metadata?: Partial<AgentMetadata>
  ): void {
    const normalizedKey = agentType.toLowerCase();

    let factory: AgentFactory;
    if (
      typeof factoryOrConstructor === "function" &&
      factoryOrConstructor.prototype &&
      "run" in factoryOrConstructor.prototype
    ) {
      const Ctor = factoryOrConstructor as AgentConstructor;
      factory = () => new Ctor();
    } else {
      factory = factoryOrConstructor as AgentFactory;
    }

    // Probe default metadata if not explicitly provided
    let defaultMeta: AgentMetadata;
    try {
      const sample = factory();
      defaultMeta = {
        id: sample.id,
        name: sample.name,
        version: sample.version,
        description: sample.description,
        agentType: sample.agentType,
        tags: [],
      };
    } catch {
      defaultMeta = {
        id: agentType,
        name: agentType,
        version: "1.0.0",
        description: `Agent of type ${agentType}`,
        agentType,
        tags: [],
      };
    }

    const mergedMetadata: AgentMetadata = {
      ...defaultMeta,
      ...metadata,
      id: metadata?.id || defaultMeta.id || agentType,
      agentType: metadata?.agentType || defaultMeta.agentType || agentType,
    };

    this.entries.set(normalizedKey, {
      factory,
      metadata: mergedMetadata,
    });
  }

  /**
   * Unregisters an agent by type key.
   */
  public unregister(agentType: string): boolean {
    return this.entries.delete(agentType.toLowerCase());
  }

  /**
   * Checks whether an agent type is currently registered.
   */
  public has(agentType: string): boolean {
    return this.entries.has(agentType.toLowerCase());
  }

  /**
   * Instantiates an agent instance by its registered type.
   */
  public create<T extends IAgent<any, any> = IAgent<any, any>>(
    agentType: string,
    ...args: unknown[]
  ): T {
    const normalizedKey = agentType.toLowerCase();
    const entry = this.entries.get(normalizedKey);

    if (!entry) {
      const available = this.listTypes().join(", ");
      throw new AgentRegistryError(
        `Agent type "${agentType}" is not registered. Registered types: [${available}]`
      );
    }

    try {
      return (entry.factory as any)(...(args as any[])) as T;
    } catch (err: any) {
      throw new AgentRegistryError(
        `Failed to instantiate agent "${agentType}": ${err.message}`
      );
    }
  }

  /**
   * Returns metadata for a registered agent type.
   */
  public getMetadata(agentType: string): AgentMetadata | undefined {
    return this.entries.get(agentType.toLowerCase())?.metadata;
  }

  /**
   * Lists all registered agent types.
   */
  public listTypes(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Returns metadata records for all registered agents.
   */
  public listRegistered(): AgentMetadata[] {
    return Array.from(this.entries.values()).map((entry) => entry.metadata);
  }

  /**
   * Finds agents associated with a specific tag or category.
   */
  public findByCategory(category: string): AgentMetadata[] {
    const lowerCategory = category.toLowerCase();
    return this.listRegistered().filter(
      (meta) =>
        meta.agentType.toLowerCase() === lowerCategory ||
        meta.tags?.some((t) => t.toLowerCase() === lowerCategory)
    );
  }

  /**
   * Clears all registered agents.
   */
  public clear(): void {
    this.entries.clear();
  }
}
