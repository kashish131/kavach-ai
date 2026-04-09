import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY ||
  (process.env.GEMINI_API_URL ? new URL(process.env.GEMINI_API_URL).searchParams.get('key') : undefined);
if(!key){
  console.error('no key');
  process.exit(1);
}

async function list() {
  try {
    const r = await axios.get('https://generativelanguage.googleapis.com/v1/models', { params: { key } });
    console.log(JSON.stringify(r.data, null, 2));
  } catch(e){
    console.error('err', e.response?.data || e.message);
  }
}
list();
