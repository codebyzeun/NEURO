class TimeUtils {
    static nowISO() {
        return new Date().toISOString();
    }
    static nowUnix() {
        return Math.floor(Date.now() / 1000);
    }
    static formatTime(input) {
        let date;
        if (typeof input === 'number') {
            date = new Date(input * 1000);
        } else if (input instanceof Date) {
            date = input;
        } else {
            date = new Date(input);
        }
        return date.toTimeString().split(' ')[0];
    }
    static elapsedSeconds(start, end) {
        return Math.floor((end - start) / 1000);
    }
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static schedule(fn, ms) {
        return setTimeout(fn, ms);
    }
    static cancelSchedule(timeoutId) {
        clearTimeout(timeoutId);
    }
}
module.exports = TimeUtils;