import dotenv from 'dotenv';
dotenv.config();
console.log(Object.keys(process.env).filter(k => k.toLowerCase().includes('supa') || k.toLowerCase().includes('db') || k.toLowerCase().includes('post')));
