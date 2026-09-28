const fs = require('fs');
const path = require('path');

const navPath = path.join(__dirname, 'src', 'lib', 'navigation.ts');
let content = fs.readFileSync(navPath, 'utf8');

const campaignItem = `
      {
        id: "campaigns",
        name: "Email Campaigns",
        href: "/crm/campaigns",
        description: "Upload scraped lists & send mass emails",
        iconName: "Mail",
        badge: "Blast",
      },`;

content = content.replace('items: [', 'items: [' + campaignItem);
fs.writeFileSync(navPath, content, 'utf8');
console.log("Updated navigation.ts");
