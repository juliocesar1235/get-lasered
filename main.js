import { GameManager } from './classes/game-manager';



let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
    _APP = new GameManager();
})