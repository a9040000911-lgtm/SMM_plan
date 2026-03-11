/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

module.exports = {
    Queue: class Queue {
        constructor() { }
        add() { return Promise.resolve(); }
    },
    Worker: class Worker {
        constructor() { }
        on() { }
        close() { return Promise.resolve(); }
    }
};
