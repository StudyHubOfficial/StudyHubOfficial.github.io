"use strict";
// RUN LOCALLY ONLY. Do not put this script/credentials in the public web folder.
const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");
const PROJECT = "studyhubofficial-2e2de";
const EMAIL = "ehtshamulhaq100@gmail.com";

function hiddenPrompt(prompt) {
  return new Promise((resolve,reject)=>{
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      reject(new Error("Run this script in an interactive terminal (Windows PowerShell or CMD)."));return;
    }
    process.stdout.write(prompt);
    let chars = [];
    const old = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    function finished(err,value) {
      process.stdin.off("data",input);
      process.stdin.setRawMode(Boolean(old));
      process.stdin.pause();
      process.stdout.write("\n");
      chars = [];
      if(err) reject(err); else resolve(value);
    }
    function input(data) {
      for(const byte of data) {
        if(byte===3){finished(new Error("Cancelled"));return;}
        if(byte===13 || byte===10){finished(null,chars.join(""));return;}
        if(byte===8 || byte===127){if(chars.length){chars.pop();process.stdout.write("\b \b");}continue;}
        if(byte>=32 && byte<=126){chars.push(String.fromCharCode(byte));process.stdout.write("*");}
      }
    }
    process.stdin.on("data",input);
  });
}
async function main() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if(!keyPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to your NEW private Firebase service-account JSON path.');
  const key = JSON.parse(fs.readFileSync(path.resolve(keyPath),'utf8'));
  if(key.project_id !== PROJECT || key.type !== 'service_account') throw new Error('Service-account JSON does not match expected Firebase project.');
  const password = await hiddenPrompt('New First Admin password (hidden): ');
  if(password.length < 8) throw new Error('Use at least 8 characters.');
  const confirmation = await hiddenPrompt('Confirm password (hidden): ');
  if(password !== confirmation) throw new Error('Passwords do not match.');
  admin.initializeApp({credential:admin.credential.cert(key),projectId:PROJECT});
  const auth=admin.auth();
  try {
    const user=await auth.getUserByEmail(EMAIL);
    await auth.updateUser(user.uid,{password,emailVerified:true,disabled:false});
    console.log('SUCCESS: First Admin password updated, account enabled and verified.');
  } catch(err) {
    if(err.code !== 'auth/user-not-found') throw err;
    await auth.createUser({email:EMAIL,password,emailVerified:true,disabled:false});
    console.log('SUCCESS: First Admin created, enabled and verified.');
  }
  console.log('Project:',PROJECT,'\nEmail:',EMAIL);
}
main().catch(err=>{console.error('SETUP FAILED:',err.message || err);process.exitCode=1;});
