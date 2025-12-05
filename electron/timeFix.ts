import { net } from 'electron';

/**
 * Checks for clock skew against a reliable server (Google) and patches
 * the global Date object if the system time is significantly off.
 * This fixes the "2025 Bug" where future/past system dates cause
 * Firebase Admin SDK to generate invalid JWTs.
 */
export function applyTimePatch() {
    const request = net.request({
        method: 'HEAD',
        url: 'https://www.google.com'
    });

    request.on('response', (response) => {
        const serverDateHeader = response.headers['date'];
        const serverDateStr = Array.isArray(serverDateHeader) ? serverDateHeader[0] : serverDateHeader;

        if (serverDateStr) {
            const realTime = new Date(serverDateStr).getTime();
            const localTime = Date.now();
            const offset = realTime - localTime;

            // correct only if skew is > 1 minute
            if (Math.abs(offset) > 60000) {
                console.log(`[TimeFix] Clock skew detected! System: ${new Date(localTime).toISOString()}, Real: ${new Date(realTime).toISOString()}, Offset: ${offset}ms`);

                const OriginalDate = Date;

                // Create a proxy class to override Date
                class PatchedDate extends OriginalDate {
                    constructor(...args: any[]) {
                        if (args.length === 0) {
                            // new Date() -> return corrected time
                            super(OriginalDate.now() + offset);
                        } else {
                            // new Date(...args) -> pass through
                            // @ts-ignore
                            super(...args);
                        }
                    }

                    static now() {
                        return OriginalDate.now() + offset;
                    }
                }

                // Apply policy
                global.Date = PatchedDate as any;

                console.log('[TimeFix] Applied Date patch to match server time.');
            } else {
                console.log('[TimeFix] Time is synced (skew < 1min).');
            }
        }
    });

    request.on('error', (err) => {
        console.warn('[TimeFix] Failed to check time skew:', err.message);
    });

    request.end();
}
