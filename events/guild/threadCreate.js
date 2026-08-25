//The Module
module.exports = async (client, thread) => {
    try {
        if (thread.joinable && !thread.joined) {
            await thread.join();
        }
    } catch (e) {
        console.log(String(e).grey);
    }
};
/**
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
