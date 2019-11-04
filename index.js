const DIV_ELEM = document.createElement("div");
const SPAN_ELEM = document.createElement("span");
const SUP_ELEM = document.createElement("sup");
const TEXT_AREA = document.createElement("textarea")

const getLang = () =>{
    let lang = localStorage.getItem("lang");
    return  lang === null ? "RU" : lang;
}

let __currentLang__ = getLang();

const COMMAND_KEYS = {
    CAPS_PRESSED: false,
    SHIFT_PRESSED: false,
    ALT_PRESSED: false
}

const nextLang = (lang) => {
    switch(lang){
        case "RU":
            return "EN";
        case "EN":
            return "RU";
        default:
            throw Error(`NEXT_LANG: lang is not supported: ${lang}`);
    }
}

const isUpperCase = () => {
    const { CAPS_PRESSED, SHIFT_PRESSED } = COMMAND_KEYS;
    return CAPS_PRESSED && !SHIFT_PRESSED || !CAPS_PRESSED && SHIFT_PRESSED;
} 

const SPECIAL_ACTIONS = {

    "space": {
        realName: ' ',
        func: (input) => {
            return () => {
                input.value += ' ';
            }
        }
    },
    "shift": {
        realName: "ShiftLeft",
    },
    "shift ": {
        realName: "ShiftRight",
    },
    "ctrl": {
        realName: "ControlLeft",
    },
    "ctrl ": {
        realName: "ControlRight",
    },
    "tab": {
        realName: "Tab",
        func: (input) => {
            return () => {
                input.value += "\t";
            }
        }
    },
    "capslock": {
        realName: "CapsLock",
    },
    "backspace": {
        realName: "Backspace",
        func: (input) => {
            return () => {
                input.value = input.value.slice(0, input.value.length - 1);
            }
        }
    },
    "enter": {
        realName: "Enter",
        func: (input) => {
            return () => {
                input.value += "\n";
            }
        }
    },
    "arrow up": {
        realName: "ArrowUp",
    },
    "arrow down": {
        realName: "ArrowDown",
    },
    "arrow left": {
        realName: "ArrowLeft",
    },
    "arrow right": {
        realName: "ArrowRight",
    },
    "win": {
        realName: "MetaLeft",
    },
    "alt": {
        realName: "AltLeft",
    },
    "alt ": {
        realName: "AltRight",
    },

};

class KeyboardButton {
    constructor(id){
        this.__id = id;
        this.__divElem = DIV_ELEM.cloneNode();
        this.__divElem.className = "button";

        this.__spanElem = SPAN_ELEM.cloneNode();
        this.__spanElem.className = "char";

        this.__divElem.appendChild(this.__spanElem);
        
        this.__innerText;
    }

    applyInnerText(){
        this.__spanElem.innerText = this.__innerText;
    }

    get translationNeeded(){
        return false;
    }

    get nodeElement(){
        return this.__divElem;
    }

    get code() {
        return this.__id;
    }

    keyDown(){
        this.__divElem.classList.add("buttonPressed");
        if (this.__divElem.onclick)
            this.__divElem.onclick();
    }

    keyUp(){
        this.__divElem.classList.remove("buttonPressed");
    }

    assignMouseHandlers(){
        this.__divElem.addEventListener("mousedown", () => {
            this.__divElem.classList.add("buttonPressed");
        });
        this.__divElem.addEventListener("mouseup", () => {
            this.__divElem.classList.remove("buttonPressed");
        })
    }

    signOnClick(input){
        this.assignMouseHandlers();
        this.__divElem.onclick = () => {
            if (isUpperCase())
                input.value += this.__innerText.toUpperCase();
            else 
                input.value += this.__innerText;
        }
    }
}

class ButtonSymbol extends KeyboardButton {
    constructor(id, enChar, ruChar){
        super(id);
        this.__divElem.className = `${this.__divElem.className} symbolButton`;
        this.__enChar = enChar;
        this.__ruChar = ruChar;
    }

    swapChar(lang){
        switch(lang){
            case "EN":
                this.__innerText = this.__enChar;
                break;
            case "RU":
                this.__innerText = this.__ruChar;
                break;
            default:
                throw Error(`BUTTON: Language is not allowed: ${lang}`)
        }
        this.applyInnerText();
    }

    get translationNeeded(){
        return true;
    }
}

class ButtonDigit extends ButtonSymbol {
    constructor(id, uniChar, ruDigit, enDigit){
        super(id, enDigit, ruDigit);
        this.__divElem.className = `${this.__divElem.className} buttonDigit`;

        this.__uniChar = uniChar
        this.__superElem = SUP_ELEM.cloneNode();
        this.__superElem.className = "supChar";

        this.__divElem.insertBefore(this.__superElem, this.__spanElem);
        
        this.__innerSup;
        this.__spanElem.innerText = this.__uniChar;
    }

    applyInnerText(){
        this.__superElem.innerText = this.__innerText;
    }

    signOnClick(input){
        this.assignMouseHandlers();
        this.__divElem.onclick = () => {
            if (isUpperCase()){
                if (__currentLang__ === "RU"){
                    input.value += this.__ruChar;
                } else {
                    input.value += this.__enChar;
                }
            } else {
                input.value += this.__uniChar;
            }
        }
    }
}

class ButtonCommand extends KeyboardButton {
    constructor(id, name){
        super(id);
        this.__divElem.className = `${this.__divElem.className} commandButton ${name}`;
        this.__innerText = name;
        this.__spanElem.innerText = name;
        this.__spAction = SPECIAL_ACTIONS[name];

        if (this.__spAction !== undefined)
            this.__uniChar = this.__spAction.realName;
        else 
            throw Error(`BUTTON: unknown command ${name}`);
    }

    signOnClick(input){
        this.assignMouseHandlers();
        if (this.__spAction.func !== undefined)
            this.__divElem.onclick = this.__spAction.func(input);
    }
    
}

class Keyboard {
    constructor(bodyElem, inputElem){
        this.__mainElem = DIV_ELEM.cloneNode();
        this.__mainElem.className = "keyboard";

        bodyElem.appendChild(this.__mainElem);

        this.__inputElem = inputElem;
        this.__buttons = {};
        this.__pressed = {};
    }

    getButtonByCode(code){
        return this.__buttons[code];
    }

    pressButton(code){
        let button = this.getButtonByCode(code);
        if (button === null){
            return;
        }
        this.__pressed[code] = button;
        button.keyDown();
    }

    unpressButton(code){
        let button = this.getButtonByCode(code);
        if (button === null){
            return;
        }
        delete this.__pressed[code];
        button.keyUp();
    }

    unpressAll(){
        let pressed = this.__pressed;
        for (let key of Object.keys(pressed)){
            this.unpressButton(pressed[key]);
            delete pressed[key];
        }
    }
    
    bindButtons(buttonsArr){
        let newNode = DIV_ELEM.cloneNode();
        for (let buttonsArray of buttonsArr){
            for (let button of buttonsArray){
                this.__buttons[button.code] = button;
                button.signOnClick(this.__inputElem.__mainElem);
                newNode.appendChild(button.nodeElement);
            }
            this.__mainElem.appendChild(newNode);
            newNode.className = "keyboardRow";
            newNode = DIV_ELEM.cloneNode();
        }
    }

    switchLanguage(lang){
        if (lang !== "EN" && lang !== "RU"){
            throw Error(`KEYBOARD: language is not supported ${lang}`);
        }
        for (let code of Object.keys(this.__buttons)){
            let button = this.__buttons[code];
            if (button.translationNeeded)
                this.__buttons[code].swapChar(lang);
        }
    }
}

class Input {
    constructor(bodyElem){
        this.__mainElem = TEXT_AREA.cloneNode();
        this.__mainElem.value = "";
        this.__mainElem.className = "input";
        bodyElem.appendChild(this.__mainElem);
        this.__innerText;

        this.__mainElem.readOnly = true;
    }
}

const BUTTONS_ARRAY = () =>{
    let raw = [
        [
            [192, '`', 'ё', '~'], [49, '1', '!', '!'], [50, '2', '@', '"'], [51, '3', '№', '#'], [52, '4', ';', '$'], [53, '5', '%', '%'], 
            [54, '6', ':', '^'], [55, '7', '?', '&'], [56, '8', '*', '*'], [57, '9', '(', '('], [48, '0', ')', ')'], [189, '-', '_', '_'], 
            [187, '=', '+', '+'], [8, "backspace"]
        ],
        [
            [9, "tab"], [81, 'q', 'й'], [87, 'w', 'ц'], [69, 'e', 'у'], [82, 'r', 'к'], [84, 't', 'е'], [89, 'y', 'н'], [85, 'u', 'г'], 
            [73, 'i', 'ш'], [79, 'o', 'щ'], [80, 'p', 'з'], [219, '[', 'х'], [221, ']', 'ъ'], [220, '\\', '/', '|']
        ],
        [
            [20, "capslock"], [65, 'a', 'ф'], [83, 's', 'ы'], [68, 'd', 'в'], [70, 'f', 'а'], [71, 'g', 'п'], [72, 'h', 'р'], 
            [74, 'j', 'о'], [75, 'k', 'л'], [76, 'l', 'д'], [186, ';', 'ж'], [222, "'", 'э'], [13, "enter"]
        ],
        [
            [16, "shift"], [90, 'z', 'я'], [88, 'x', 'ч'], [67, 'c', 'с'], [86, 'v', 'м'], [66, 'b', 'и'], [78, 'n', 'т'], [77, 'm', 'ь'], 
            [188, ',', 'б', '<'], [190, '.', 'ю', '>'], [191, '/', '?', ','], [38, "arrow up"], [19, "shift "]
        ],
        [
            [17, "ctrl"], [91, "win"], [18, "alt"], [32, "space"], [18, "alt "], [17, "ctrl "], [37, "arrow left"], [40, "arrow down"], 
            [39, "arrow right"]
        ]
    ];
    let buttons = [];
    let tmp = [];
    for (let srcArr of raw){
        for (let bSrc of srcArr){
            let button;
            if (bSrc.length === 4){
                button = new ButtonDigit(...bSrc);
            } else if (bSrc.length === 3){
                button = new ButtonSymbol(...bSrc);
            } else {
                button = new ButtonCommand(...bSrc);
            }
            tmp.push(button);
        }
        buttons.push(tmp);
        tmp = [];
    }
    return buttons;
} 


function __init__(){
    const BODY = document.querySelector("body");

    const inputElem = new Input(BODY);
    const KEYBOARD = new Keyboard(BODY, inputElem);

    KEYBOARD.bindButtons(BUTTONS_ARRAY());
    KEYBOARD.switchLanguage(__currentLang__);
    
    function keydownListener(e){
        console.log("e=>", e.keyCode, e);
        //console.log(e.keyCode);
        if (e.shiftKey){
            COMMAND_KEYS["SHIFT_PRESSED"] = true;
        } else {
            COMMAND_KEYS["SHIFT_PRESSED"] = false;
        }

        if (e.shiftKey && e.altKey){
            __currentLang__ = nextLang(__currentLang__);
            KEYBOARD.switchLanguage(__currentLang__);
            localStorage.setItem("lang", __currentLang__);
        }

        KEYBOARD.pressButton(e.keyCode);
    }

    function keyUpListener(e){
        if (e.code === "CapsLock"){
            COMMAND_KEYS["CAPS_PRESSED"] = !COMMAND_KEYS["CAPS_PRESSED"];
        } 
        KEYBOARD.unpressButton(e.keyCode);
    }

    function clickListener(){
    }

    BODY.addEventListener("keydown", keydownListener);
    BODY.addEventListener("keyup", keyUpListener);
    BODY.addEventListener("click", clickListener);
}

__init__();