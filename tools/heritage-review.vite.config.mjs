/** Local review only: isolated loopback ports; no change to the shared Vite config. */
import {fileURLToPath} from 'node:url';
function port(name,fallback){
 const value=Number(process.env[name]||fallback);
 if(!Number.isInteger(value)||value<1024||value>65535)throw Error(`${name} must be a port between 1024 and 65535`);
 return value;
}
export default {
 root:fileURLToPath(new URL('../frontend',import.meta.url)),
 server:{host:'127.0.0.1',port:port('FASTONE_REVIEW_WEB_PORT',15173),strictPort:true,
  proxy:{'/api':`http://127.0.0.1:${port('FASTONE_REVIEW_API_PORT',18001)}`}},
};
