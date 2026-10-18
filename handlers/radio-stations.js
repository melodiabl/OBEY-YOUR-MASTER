const source = require('../botconfig/radiostations.json');
// Preserve legacy station numbering; additional regions follow that catalog.
const entries = [];
let position = 0;
function append(value, group) {
    if (Array.isArray(value)) {
        for (const item of value) {
            position++;
            const match = /^(\S+)\s+(https?:\/\/\S+)\s*$/.exec(item);
            if (!match)
                continue;
            try {
                const url = new URL(match[2]);
                if (url.username || url.password)
                    continue;
                entries.push({
                    id: String(position), title: `${group} · ${match[1].replaceAll('-', ' ')}`.slice(0, 100), url: url.href
                });
            }
            catch {
            }
        }
    }
    else if (value && typeof value === 'object')
        for (const [key, child] of Object.entries(value))
            append(child, `${group} · ${key.replaceAll('_', ' ')}`);
}
for (const key of ['REYFM', 'ILOVERADIO', 'EU', 'OTHERS', 'AMERICA'])
    append(source[key], key);
const urls = new Set(entries.map(e => e.url));
module.exports = {
    stations: entries, isStationUrl: value => { try { return urls.has(new URL(value).href) } catch { return false } }
};
