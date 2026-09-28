"use client";

import React, { useState } from 'react';
import { Mail, Users, Send, CheckCircle2, AlertCircle, UploadCloud, RefreshCw } from 'lucide-react';

export default function EmailCampaignsPage() {
  const [step, setStep] = useState(1);
  const [listName, setListName] = useState("");
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("idle");

  const emailCount = emails.split('\n').filter(e => e.trim().includes('@')).length;

  const handleSend = () => {
    if (!subject || !body || emailCount === 0) return;
    setStatus("sending");
    
    // Simulate sending blast to the list
    setTimeout(() => {
      setStatus("success");
      setStep(4);
    }, 2500);
  };

  const reset = () => {
    setStep(1);
    setEmails("");
    setSubject("");
    setBody("");
    setStatus("idle");
    setListName("");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="w-8 h-8 text-sky-600" />
            Email Campaigns & Newsletters
          </h1>
          <p className="text-slate-500 mt-2">
            Upload your scraped contact lists, design your email template, and blast it out to your audience.
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      {step < 4 && (
        <div className="flex items-center mb-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= s ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-4 rounded ${step > s ? 'bg-sky-600' : 'bg-slate-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step 1: Import List */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            1. Import Email List
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Audience Name</label>
              <input 
                type="text" 
                placeholder="e.g. Scraped Contractors List V2"
                value={listName}
                onChange={e => setListName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Paste Email Addresses (One per line)</label>
              <textarea 
                rows={10}
                placeholder="john@example.com&#10;sarah@example.com&#10;..."
                value={emails}
                onChange={e => setEmails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono text-sm"
              />
              <div className="mt-2 text-sm font-medium text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Detected {emailCount} valid email addresses
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={emailCount === 0 || !listName}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Continue to Design
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Design Email */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-600" />
            2. Design Email Campaign
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Subject Line</label>
              <input 
                type="text" 
                placeholder="Exciting news regarding your business..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Body (Plain Text / HTML)</label>
              <textarea 
                rows={12}
                placeholder="Hi there,&#10;&#10;We wanted to reach out because..."
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-900 font-medium px-6 py-3 transition-colors"
              >
                &larr; Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!subject || !body}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Review Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Send */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-600" />
            3. Review & Blast
          </h2>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <span className="text-slate-500 text-sm">Subject:</span>
                  <span className="ml-2 font-bold text-slate-900">{subject}</span>
                </div>
                <div className="p-6 bg-white min-h-[300px] whitespace-pre-wrap text-slate-700">
                  {body}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-sky-50 border border-sky-100 p-6 rounded-xl">
                <h3 className="font-bold text-sky-900 mb-4">Campaign Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">List Name:</span>
                    <span className="font-semibold text-slate-900">{listName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recipients:</span>
                    <span className="font-semibold text-sky-600 bg-sky-100 px-2 rounded-full">{emailCount} Emails</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-semibold text-slate-900">Standard Delivery</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  By clicking send, this campaign will instantly dispatch to all {emailCount} recipients. Ensure you comply with CAN-SPAM and local regulations.
                </p>
              </div>

              <button 
                onClick={handleSend}
                disabled={status === 'sending'}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold tracking-wide transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70"
              >
                {status === 'sending' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Blast Campaign Now
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setStep(2)}
                disabled={status === 'sending'}
                className="w-full py-2 text-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Edit Design
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-12 border border-slate-200 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-emerald-600/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Blast Sent Successfully!</h2>
          <p className="text-slate-500 text-lg mb-8">
            Your campaign <strong className="text-slate-800">"{listName}"</strong> has been successfully queued and dispatched to {emailCount} recipients.
          </p>
          <div className="flex justify-center gap-4">
            <a href="/" className="px-6 py-3 rounded-lg font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              Return to Dashboard
            </a>
            <button onClick={reset} className="px-6 py-3 rounded-lg font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors">
              Create Another Campaign
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
