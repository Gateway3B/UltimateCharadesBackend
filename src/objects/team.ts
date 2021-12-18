const crypto = require('crypto');

export enum team {
    one = 1,
    two,
    rand = crypto.randomInt(2) + 1
}