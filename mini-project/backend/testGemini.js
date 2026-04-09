import dotenv from 'dotenv';
dotenv.config();
import geminiResponse from './gemini.js';

// test script - make sure you set either GEMINI_API_KEY in .env
// or leave the original GEMINI_API_URL with a valid ?key=... query parameter.
// Optional: set GEMINI_MODEL if you need a different model name.

(async ()=>{
    try{
        const r = await geminiResponse('hello world','assist','user');
        console.log('GEMINI RESPONSE:', r);
    }catch(e){
        console.error('ERROR CALLING GEMINI:', e);
    }
})();
