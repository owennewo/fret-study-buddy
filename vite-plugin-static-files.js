// vite-plugin-static-files.js
import { resolve } from 'path';
import fs from 'fs';

export default function staticFiles() {
    return {
        name: 'static-files',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url === '/artyom.window.min.js') {
                    const filePath = resolve(__dirname, 'node_modules/artyom.js/build/artyom.window.min.js');
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            res.statusCode = 404;
                            res.end('Not Found');
                            return;
                        }
                        res.setHeader('Content-Type', 'application/javascript');
                        res.end(data);
                    });
                } else {
                    next();
                }
            });
        }
    };
}
