const DIV_ELEM = document.createElement("div");
const SPAN_ELEM = document.createElement("span");
const SUP_ELEM = document.createElement("sup");
const TEXT_AREA = document.createElement("textarea")

const getLang = () =>{
    let lang = localStorage.getItem("lang");
    return  lang === null ? "RU" : lang;
}

let __currentLang__ = getLang();//"RU";

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
    constructor(){
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

    get allChars() {
        return {
            en: this.__enChar,
            ru: this.__ruChar,
            uni: this.__uniChar,
        }
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
    constructor(enChar, ruChar){
        super();
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
    constructor(uniChar, ruDigit, enDigit){
        super(enDigit, ruDigit);
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
    constructor(name){
        super();
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
        this.__buttons = null;
        this.__buttonsBySymbol = {
            en: {},
            ru: {},
            uni: {}
        }
        this.__pressed = {};
    }

    getButtonByChar(char){
        let { en, ru, uni } = this.__buttonsBySymbol;

        if (char in en){
            return en[char];
        } else if (char in ru){
            return ru[char];
        } else if (char in uni){
            return uni[char];
        } 

        return null;
    }

    pressButton(char){
        let button = this.getButtonByChar(char);
        if (button === null){
            return;
        }
        this.__pressed[char] = button;
        button.keyDown();
    }

    unpressButton(char){
        let button = this.getButtonByChar(char);
        if (button === null){
            return;
        }
        delete this.__pressed[char];
        button.keyUp();
    }

    unpressAll(){
        let pressed = this.__pressed;
        for (let key of Object.keys(pressed)){
            this.unpressButton(pressed[key]);
        }
    }
    
    bindButtons(buttonsArr){
        this.__buttons = buttonsArr;
        let newNode = DIV_ELEM.cloneNode();
        for (let buttonsArray of buttonsArr){
            for (let button of buttonsArray){
                let chars = button.allChars;
                for (let key of Object.keys(chars)){
                    this.__buttonsBySymbol[key][chars[key]] = button;
                }
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
        for (let buttonsArray of this.__buttons){
            for (let button of buttonsArray){
                if (button.translationNeeded)
                    button.swapChar(lang);
            }
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
        ["`:ё:~", "1:!:!", '2:":@', "3:№:#", "4:;:$", "5:%:%","6::^","7:?:&","8:*:*","9:(:(","0:):)","-:_:_", "=:+:+", "backspace"],
        ["tab", "q:й", "w:ц", "e:у", "r:к", "t:е", "y:н", "u:г", "i:ш", "o:щ", "p:з", "[:х", "]:ъ", "\\:/:|"],
        ["capslock", "a:ф", "s:ы", "d:в", "f:а", "g:п", "h:р", "j:о", "k:л", "l:д", ";:ж", "\":э", "enter"],
        ["shift", "z:я", "x:ч", "c:с", "v:м", "b:и", "n:т", "m:ь", ",:б", ".:ю", "arrow up", "shift "],
        ["ctrl", "win", "alt", "space", "alt ", "ctrl ", "arrow left", "arrow down", "arrow right"]
    ];
    let buttons = [];
    let tmp = [];
    for (let srcArr of raw){
        for (let bSrc of srcArr){
            let src = bSrc.split(":");
            let button;
            if (src.length === 3){
                if (src[0] === '6'){
                    button = new ButtonDigit(src[0], ':', src[2]);
                } else {
                    button = new ButtonDigit(...src);
                }
            } else if (src.length === 2){
                button = new ButtonSymbol(...src);
            } else {
                button = new ButtonCommand(...src);
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

        if (e.key.length === 1)
            KEYBOARD.pressButton(e.key.toLowerCase());
        else 
            KEYBOARD.pressButton(e.code);
    }

    function keyUpListener(e){
        if (e.code === "CapsLock"){
            COMMAND_KEYS["CAPS_PRESSED"] = !COMMAND_KEYS["CAPS_PRESSED"];
        } 
        if (e.key.length === 1)
            KEYBOARD.unpressButton(e.key.toLowerCase());
        else 
            KEYBOARD.unpressButton(e.code);
    }

    function clickListener(){
    }

    BODY.addEventListener("keydown", keydownListener);
    BODY.addEventListener("keyup", keyUpListener);
    BODY.addEventListener("click", clickListener);
}

__init__();