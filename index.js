const DIV_ELEM = document.createElement("div");
const SPAN_ELEM = document.createElement("span");
const SUP_ELEM = document.createElement("sup");
const TEXT_AREA = document.createElement("textarea")

const COMMAND_KEYS = {
    CAPS_PRESSED: false,
    SHIFT_PRESSED: false,
    ALT_PRESSED: false
}

const SPECIAL_ACTIONS = {

    "space": {
        func: (divElem, input) => {
            divElem.onclick = () =>{
                input.value += ' ';
            }
        }
    },
    "tab": {
        func: (divElem, input) => {
            divElem.onclick = () =>{
                input.value += "\t";
            }
        }
    },
    "backspace": {
        func: (divElem, input) => {
            divElem.onclick = () =>{
                input.value = input.value.slice(0, input.value.length - 1);
            }
        }
    },
    "enter": {
        func: (divElem, input) => {
            divElem.onclick = () =>{
                input.value += "\n";
            }
        }
    },

};

class KeyboardButton {
    constructor(id){
        this.__id = id;
        this.__divElem = DIV_ELEM.cloneNode();
        this.__spanElem = SPAN_ELEM.cloneNode();
        this.__divElem.appendChild(this.__spanElem);
        
        this.__divElem.className = "button";
        this.__spanElem.className = "char";
        this.__innerText;
    }

    applyInnerText(){
        this.__spanElem.innerText = this.__innerText;
    }

    get translationNeeded(){
        return false;
    }

    get isRepeated(){
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
    constructor(id, name, realName){
        super(id);
        this.__divElem.className = `${this.__divElem.className} commandButton ${name}`;
        this.__innerText = name;
        this.__realName = realName;
        this.__spanElem.innerText = name;
        this.__spAction = SPECIAL_ACTIONS[name];
    }

    get isRepeated(){
        return this.__realName !== null ? true : false;
    }

    get fullName(){
        return this.__realName;
    }

    signOnClick(input){
        this.assignMouseHandlers();
        if (this.__spAction !== undefined){
            this.__spAction.func(this.__divElem, input);
        }
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

    getButtonByCode(code, realName){
        let button = this.__buttons[code];
        if (button)
            if (button[realName] !== undefined){
                return this.__buttons[code][realName];
        }
        return button;
    }

    pressButton(code, realName){
        let button = this.getButtonByCode(code, realName);
        if (!button){
            return;
        }
        this.__pressed[code] = button;
        button.keyDown();
    }

    unpressButton(code, realName){
        let button = this.getButtonByCode(code, realName);
        if (!button){
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
                if (button.isRepeated){
                    if (this.__buttons[button.code]){
                        this.__buttons[button.code][button.fullName] = button;
                    } else {
                        this.__buttons[button.code] = {[button.fullName]: button};
                    }
                } else {
                    this.__buttons[button.code] = button;
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

const BUTTONS_ARRAY = [
    [
        new ButtonDigit(192, '`', 'ё', '~'), new ButtonDigit(49, '1', '!', '!'), new ButtonDigit(50, '2', '@', '"'), 
        new ButtonDigit(51, '3', '№', '#'), new ButtonDigit(52, '4', ';', '$'), new ButtonDigit(53, '5', '%', '%'), 
        new ButtonDigit(54, '6', ':', '^'), new ButtonDigit(55, '7', '?', '&'), new ButtonDigit(56, '8', '*', '*'), 
        new ButtonDigit(57, '9', '(', '('), new ButtonDigit(48, '0', ')', ')'), new ButtonDigit(189, '-', '_', '_'), 
        new ButtonDigit(187, '=', '+', '+'), new ButtonCommand(8, "backspace", null)
    ],
    [
        new ButtonCommand(9, "tab", null), new ButtonSymbol(81, 'q', 'й'), new ButtonSymbol(87, 'w', 'ц'), 
        new ButtonSymbol(69, 'e', 'у'), new ButtonSymbol(82, 'r', 'к'), new ButtonSymbol(84, 't', 'е'), 
        new ButtonSymbol(89, 'y', 'н'), new ButtonSymbol(85, 'u', 'г'), new ButtonSymbol(73, 'i', 'ш'), 
        new ButtonSymbol(79, 'o', 'щ'), new ButtonSymbol(80, 'p', 'з'), new ButtonSymbol(219, '[', 'х'), 
        new ButtonSymbol(221, ']', 'ъ'), new ButtonDigit(220, '\\', '/', '|')
    ],
    [
        new ButtonCommand(20, "capslock", null), new ButtonSymbol(65, 'a', 'ф'), new ButtonSymbol(83, 's', 'ы'), 
        new ButtonSymbol(68, 'd', 'в'), new ButtonSymbol(70, 'f', 'а'), new ButtonSymbol(71, 'g', 'п'), 
        new ButtonSymbol(72, 'h', 'р'), new ButtonSymbol(74, 'j', 'о'), new ButtonSymbol(75, 'k', 'л'), 
        new ButtonSymbol(76, 'l', 'д'), new ButtonSymbol(186, ';', 'ж'), new ButtonSymbol(222, "'", 'э'), 
        new ButtonCommand(13, "enter", null)
    ],
    [
        new ButtonCommand(16, "shift", "ShiftLeft"), new ButtonSymbol(90, 'z', 'я'), new ButtonSymbol(88, 'x', 'ч'), 
        new ButtonSymbol(67, 'c', 'с'), new ButtonSymbol(86, 'v', 'м'), new ButtonSymbol(66, 'b', 'и'), 
        new ButtonSymbol(78, 'n', 'т'), new ButtonSymbol(77, 'm', 'ь'), new ButtonDigit(188, ',', 'б', '<'), 
        new ButtonDigit(190, '.', 'ю', '>'), new ButtonDigit(191, '/', '?', ','), new ButtonCommand(38, "arrow up", null), 
        new ButtonCommand(16, "shift", "ShiftRight")
    ],
    [
        new ButtonCommand(17, "ctrl", "ControlLeft"), new ButtonCommand(91, "win", null), 
        new ButtonCommand(18, "alt", "AltLeft"), new ButtonCommand(32, "space", null), 
        new ButtonCommand(18, "alt", "AltRight"), new ButtonCommand(17, "ctrl", "ControlRight"), 
        new ButtonCommand(37, "arrow left", null), new ButtonCommand(40, "arrow down", null), 
        new ButtonCommand(39, "arrow right", null)
    ]
];

const getLang = () =>{
    let lang = localStorage.getItem("lang");
    return  lang === null ? "RU" : lang;
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

let __currentLang__ = getLang();

function __init__(){
    const BODY = document.querySelector("body");

    const inputElem = new Input(BODY);
    const KEYBOARD = new Keyboard(BODY, inputElem);

    KEYBOARD.bindButtons(BUTTONS_ARRAY);
    KEYBOARD.switchLanguage(__currentLang__);
    
    function keydownListener(e){
        const { keyCode, code, shiftKey, altKey } = e;

        if (shiftKey){
            COMMAND_KEYS["SHIFT_PRESSED"] = true;
        } else {
            COMMAND_KEYS["SHIFT_PRESSED"] = false;
        }

        if (shiftKey && altKey){
            __currentLang__ = nextLang(__currentLang__);
            KEYBOARD.switchLanguage(__currentLang__);
            localStorage.setItem("lang", __currentLang__);
        }

        KEYBOARD.pressButton(keyCode, code);
    }

    function keyUpListener(e){
        const { keyCode, code } = e;
        if (code === "CapsLock"){
            COMMAND_KEYS["CAPS_PRESSED"] = !COMMAND_KEYS["CAPS_PRESSED"];
        } 
        KEYBOARD.unpressButton(keyCode, code);
    }

    function clickListener(){
    }

    BODY.addEventListener("keydown", keydownListener);
    BODY.addEventListener("keyup", keyUpListener);
    BODY.addEventListener("click", clickListener);
}

__init__();