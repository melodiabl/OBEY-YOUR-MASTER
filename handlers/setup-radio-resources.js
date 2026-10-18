const { z } = require('zod');
const { label, field, channel } = require('./setup-fields');
const { openSetupChoices } = require('./setup-choices');
const { openFormSetup } = require('./setup-form');
const { createSetupSettings } = require('./setup-settings');
const { stations, isStationUrl } = require('./radio-stations');
const { activateRadio, stopRadio } = require('./music/radio-setup');
function radioDefinition(client, guildId, station) {
    const oldChannel = client.settings.get(guildId, 'channel'), voice = client.guilds.cache.get(guildId)?.channels.cache.get(oldChannel), oldSong = client.settings.get(guildId, 'song'), oldVolume = Number(client.settings.get(guildId, 'volume'));
    const fields = {
        channel: channel('radio.channel', voice?.type === 2 ? voice.id : '', 'Canal de voz de la radio', 'Radio voice channel', {
            channelTypes: [2], send: false
        }), song: field('radio.song', 'text', isStationUrl(oldSong) ? oldSong : stations[0].url, z.string().refine(isStationUrl), 'URL de estación del catálogo', 'Catalog station URL', {
            maxInput: 2000
        }), volume: field('radio.volume', 'number', Number.isInteger(oldVolume) && oldVolume >= 1 && oldVolume <= 150 ? oldVolume : 50, z.number().int().min(1).max(150), 'Volumen (1–150)', 'Volume (1–150)')
    };
    return {
        title: label('Radio y sala de espera', 'Radio and waiting room'), store: 'settings', fields, ...(station ? {
            initialDraft: {
                song: station.url
            }
        } : {}), description: label('Guardar conserva preferencias. Publicar sustituye la reproducción actual por esta estación; debes estar en el canal elegido. Retirar detiene esa radio y desactiva su reconexión 24/7. No se comprueba aquí la disponibilidad de la emisión.', 'Save keeps preferences. Publish replaces current playback with this station; you must be in the selected channel. Unpublish stops that radio and disables its 24/7 reconnection. Stream availability is not checked here.'), preview: values => stations.find(s => s.url === values.song)?.title || values.song, publish: (c, context) => activateRadio(c, context, createSetupSettings(c.settings, fields)), unpublish: stopRadio
    };
}
function openRadioSetup(client, origin, stationId, volume) {
    const selected = stations.find(station => station.id === String(stationId));
    if (selected) {
        const definition = radioDefinition(client, origin.guild.id, selected);
        if (Number.isInteger(Number(volume)) && Number(volume) >= 1 && Number(volume) <= 150) definition.initialDraft.volume = Number(volume);
        return openFormSetup(client, origin, definition);
    }
    return openSetupChoices(client, origin, label('Radio', 'Radio'), [{
            id: 'current', title: label('Preferencias guardadas', 'Saved preferences'), open: (c, m) => openFormSetup(c, m, radioDefinition(c, m.guild.id))
        }, ...stations.map(station => ({
            id: station.id, title: {
                es: station.title, en: station.title
            }, open: (c, m) => openFormSetup(c, m, radioDefinition(c, m.guild.id, station))
        }))]);
}
module.exports = {
    openRadioSetup, radioDefinition
};
