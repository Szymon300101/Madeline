var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
//const Window = require('window');
//const window = new Window();
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    console.log('Gra i trąbi, zapraszam do stolika')
    //let a=new Array(10)
   // console.log(window.crypto.getRandomValues(a))
});

const colors=['trefl','karo','kier','pik','']
const figures=['2','3','4','5','6','7','8','9','10','walet','dama','król','as','JOKER']
const cards_max = 4;
let coins_max=6;            //limit żetonów
let users=new Array();      //numery dotychczas aktywnych urzytkowników
let user_names=new Array(); //nicki urzytkowników
let cards=new Array();      //lista list kart poszczególnych urzytkowników
let coins=new Array();      //lista ilości żetonów urzytkowników
let init=new Array();       //aktualna lista kart inicjatywy
let init_names=new Array(); //lista nicków przypisanych do kart inicjatywy
let init_hp=new Array();    //ilości znaczników poszczególnych graczy
let init_ac=new Array();    //obrona poszczególnych graczy

bot.on('message', function (user, userID, channelID, message, evt) {
	console.log(evt)
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        
        //aliasy
        if(cmd=='thx')cmd='dzięki'
        if(cmd=='dziękuję')cmd='dzięki'
        if(cmd=='card')cmd='cards'
        if(cmd=='coin')cmd='coins'
        if(cmd=='roll')cmd='w'

        args = args.splice(1);
        switch(cmd) {
            case 'dzięki':      //odrobina grzeczności
                bot.sendMessage({
                    to: channelID,
                    message: 'Cała przyjemność po mojej stronie!\nW końcu mi za to płacą.'
                });
            break;
            case 'hej':      //odrobina grzeczności
                bot.sendMessage({
                    to: channelID,
                    message: 'Witam państwa! Czego sobie państwo życzą?'
                });
            break;
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            case 'w':{          //rzut kostką
                let pule=2;
                let atr=11;
                let msg="";
                for(let i=0;i<args.length;i++)      //odczyt parametrów
                {
                    switch(args[i].substr(0,1))
                    {
                        case 'a':
                        atr=args[i].slice(1)
                        break;
                        case 'p':
                        pule=args[i].slice(1)
                        break;
                    }
                }
                if(pule==0) return;
                if(atr<=3){
                    atr = 11-atr;
                }

                msg+='```diff\n'                //formatowanie listy wyników
                let total_sum=0;
                for(let i=0;i<pule;i++)
                {
                    let results=roll(atr);
                    let sum=0;
                    let rolls=""
                    for(let k=0;k<results.length;k++)
                    {
                        if(k<results.length-1)
                            sum+=10
                        else
                            sum+=results[k]
                        if(k>0) rolls+=' + '
                        rolls+=results[k]
                    }
                    msg+="+> "
                    if(sum>10) msg+=rolls + ' = '
                    msg+=sum + '\n'
                    total_sum+=sum;
                }
                msg+='-->'
                msg+=total_sum + '\n'
                msg+='```'

                bot.sendMessage({
                    to: channelID,
                    message: 'Proszę bardzo, oto wynik: \n' + msg
                });
            }break;
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////
            case 'cards':{          //zarządzanie kartami
            	console.log("karty")
                let msg=""
                let usr=findUser(userID,user)   //odnajdywanie gracza na liście

                switch(args[0])
                {
                    case 'new':             //nowe 4 karty
                        cards[usr]=new Array();
                        for(let i=0;i<cards_max;i++)
                            cards[usr].push(new Card());

                        msg+='Dodałam karty. Oto one:'
                    break;
                    case 'add':
                        if(cards[usr].length<cards_max){
                            cards[usr].push(new Card());
                        }
                    break;
                    case 'discard':         //odrzucanie jednej karty
                        let cardID=-1;
                        for(let i=0;i<cards[usr].length;i++)
                            if(cards[usr][i].figure==args[1])
                                if(args[2]==null || cards[usr][i].color==args[2])
                                    cardID=i;
                        if(cardID!=-1)
                        {
                            cards[usr].splice(cardID,1);
                            msg+='Odrzuciłam kartę. Oto pozostałe karty:'
                        }else
                        {
                            msg+='Nie ma takiej karty. Oto karty:'
                        }
                    break;
                    case 'play':{           //zagrywanie karty
                        let cardID=-1;
                        for(let i=0;i<cards[usr].length;i++)
                            if(cards[usr][i].figure==args[1])
                                if(args[2]==null || cards[usr][i].color==args[2])
                                    cardID=i;
                        if(cardID!=-1 && cards[usr].length<=cards_max)
                        {
                            msg+='Zagrano *' + cards[usr][cardID].figure + ' ' + cards[usr][cardID].color
                            msg+='*. Oto pozostałe karty:'
                            cards[usr].splice(cardID,1);
                        }else if(cardID==-1)
                        {
                            msg+='Nie ma takiej karty. Oto karty:'
                        }
                    }break;
                }
                if(cards[usr].length>0)
                {
                    msg+='\n```diff'
                    msg+='\n+-> ' + evt.d.member.nick;
                    for(let i=0;i<cards[usr].length;i++)
                        msg+='\n- ' + cards[usr][i].figure + ' ' + cards[usr][i].color
                    msg+='\n```'
                    if(cards[usr].length>cards_max)
                    {
                        msg+='\n Za dużo kart na ręce!'
                        msg+='\n Prosze odrzucić *' + (cards[usr].length-3) + '* kart'
                    }
                }else
                {
                    msg+='```diff'
                    msg+='\nNiestety ręka jest pusta.'
                    msg+='\n```'
                }

                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
            }break;
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            case 'init': {
                let msg="";

                switch(args[0])
                {
                    case 'clear':
                        msg+='Zapraszamy od konfrontacji! \n'
                        msg+='Kto pierwszy ten lepszy! \n'
                        msg+='*!init join* aby dołączyć.'
                        init=new Array();
                        init_names=new Array();
                        init_hp=new Array();
                        init_ac=new Array();
                    break;
                    case 'join':
                        if(args[1]==null || !isNaN(args[1]))
                        {
                            init.push(new Card())
                            init_names.push(evt.d.member.nick)
                            if(args[1]!=null) init_hp.push(args[1])
                            else init_hp.push(NaN)
                            if(args[2]!=null) init_ac.push(args[2])
                            else init_ac.push(NaN)
                        }else
                        {
                            init.push(new Card())
                            init_names.push(args[1])
                            if(args[2]!=null) init_hp.push(args[2])
                            else init_hp.push(NaN)
                            if(args[3]!=null) init_ac.push(args[3])
                            else init_ac.push(NaN)
                        }
                    break;
                    case 'stats':
                        if(!isNaN(args[1]))
                        {
                            let pos=findInit(user)
                            if(pos!=-1)
                            {
                                init_hp[pos]=args[1];
                                init_ac[pos]=args[2];
                            }
                        }else
                        {
                            let pos=findInit(args[1])
                            if(pos!=-1)
                            {
                                init_hp[pos]=args[2];
                                init_ac[pos]=args[3];
                            }
                        }
                        msg+='Zmieniłam statystyki.'
                    break;
                    case 'hit': 
                        if(args[1]!=null)
                        {
                            let pos=findInit(args[1])
                            if(pos!=-1)
                            {
                                if(init_hp[pos]>0)
                                {
                                    if(args[2]==null)
                                        init_hp[pos]-=1;
                                    else 
                                        init_hp[pos]-=args[2]
                                    if(init_hp[pos]<0) init_hp[pos]=0;
                                    msg+='Ale oberwał! Ma już tylko ' + init_hp[pos] + ' znaczników.'
                                }
                                else
                                {
                                    msg+='Cóż za emocje! ' + init_names[pos] + ' wypada z gry!'
                                    kill(pos)
                                }
                            }
                        }
                    break;
                    case 'kill':
                        if(args[1]!=null) 
                        {
                            let pos=findInit(args[1])
                            if(pos!=-1)
                            {
                                kill(pos)
                                msg+='To była szybka i bezbolesna śmierć.'
                            }
                        }
                    break;
                    case 'sort':
                        sortInit()
                        msg+='Poukładałam kombatantów!'
                    break;
                    case 'round':
                        for(let i=0;i<init.length;i++)
                            init[i]=new Card();
                        sortInit()
                        if(init.length>0)
                        {
                        msg+='Witam w nowej rundzie!\n'
                        msg+='Oto nowa inicjatywa:\n'
                        msg+='```bash\n'
                        for(let i=0;i<init.length;i++)
                        {
                            msg+='\"' + init_names[i] + '\"'
                            for(let s=init_names[i].length;s<12;s++) msg+=' ';
                            if(!isNaN(init_hp[i]) && !isNaN(init_ac[i]))
                                msg+=init_hp[i] + '/' + init_ac[i]
                            else msg+='    '
                            msg+='\t-> ' + init[i].figure + ' ' + init[i].color + '\n'
                        }
                        msg+='```'
                        }
                    break;
                    default:
                        if(args[1]==null && init.length>0)
                        {
                            msg+='```bash\n'
                            for(let i=0;i<init.length;i++)
                            {
                                msg+='\"' + init_names[i] + '\"'
                                for(let s=init_names[i].length;s<12;s++) msg+=' ';
                                if(!isNaN(init_hp[i]) && !isNaN(init_ac[i]))
                                    msg+=init_hp[i] + '/' + init_ac[i]
                                else msg+='    '
                                msg+='\t-> ' + init[i].figure + ' ' + init[i].color + '\n'
                            }
                            msg+='```'
                        }
                    break;
                }


                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
            }break;
            //////////////////////////////////////////////////////////////////////////////////////////////////////////
            case 'help': {
                let msg="";
                msg+='\n***!w [aA] [pP]***  - rzut sumowaną pulą k10\n'
                msg+='     A - wartość atrybutu (przerzut) [domyślnie *brak*]\n'
                msg+='     P - pula kości [domyślnie *2*]\n'
                msg+='   Przykład:  `!w a8 p1`  - rzut 1k10 z przerzutem na 8\n\n'
                msg+='***!cards [action]***  - zarządzanie kartami\n'
                msg+='     *new* - nowa pula 4 kart\n'
                msg+='     *add* - dociąganie jednej karty (do 4)\n'
                msg+='     *discard \'card\'* - odrzucanie karty \'card\' (należy podać figurę, lub figurę i kolor)\n'
                msg+='     *play \'card\'* - zagrywainie karty \'card\' (należy podać figurę, lub figurę i kolor)\n'
                msg+='     *brak argumentu* - wypisuje posiadane karty\n'
                msg+='   Przykład:  `!cards discard 3 pik`  - odrzucenie posiadanej 3 pik\n\n'
                msg+='***!init [action]***  - zarządzanie inicjatywą\n'
                msg+='    *clear*  - przygotowuje miejsce na nową inicjatywę\n'
                msg+='    *join [hp] [def]* - dodaje wpisującego gracza do konfrontacji, daje mu kartę\n'
                msg+='    *join \'name\' [hp] [def]*  - dodaje BN\'a o nazwie \'name\', daje mu kartę\n'
                msg+='    *stats  \'name\'  \'hp\'  \'def\'* - zmienia/ustawia statystyki gracza lub BN\'a\n'
                msg+='    *hit \'name\' [dmg]* - zadaje obrażenia [domyślnie *1*]\n'
                msg+='    *kill \'name\' - usuwa uczestnika z konfrontacji\n'
                msg+='    *sort*  - układa kombatantów w kolejności inicjatywy\n'
                msg+='    *round*  - rozdaje nowe karty inicjatywy (od razu sortuje)\n'
                msg+='    *brak argumentu*  - wyświetla inicjatywę\n'
                msg+='   Przykład: `!init join łotr 4 18` - dodaje postać o nazwie *łotr* do inicjatywy\n\n'
                //msg+='```'

                bot.sendMessage({
                to: channelID,
                message: msg
                });
            }break;
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////
         }
     }
});


function roll(atr)
{
    let vals=new Array();
     vals[0]=Math.ceil(Math.random()*10)
    if(vals[0]>=atr) 
        vals=vals.concat(roll(atr))
    return vals;
}

function findUser(userID,name)
{
    let userNUM=-1
    for(let i=0;i<users.length;i++)
        if(users[i]==userID)
            userNUM=i
    if(userNUM==-1)
    {
        users.push(userID)
        user_names.push(name)
        cards.push(new Array())
        userNUM=users.length-1
    }
    return userNUM
}

function findInit(name)
{
    let init=-1;
    for(let i=0;i<init_names.length;i++)
        if(init_names[i]==name)
            init=i
    return init;
}

function kill(pos)
{
    init.splice(pos,1)
    init_names.splice(pos,1)
    init_hp.splice(pos,1)
    init_ac.splice(pos,1)
}

function sortInit()
{
    for(let i=0;i<init.length;i++)
        for(let j=0;j<init.length-i-1;j++)
            if(Card.compare(init[j],init[j+1])>0)
            {
                let t=init[j]
                init[j]=init[j+1]
                init[j+1]=t;
                t=init_names[j]
                init_names[j]=init_names[j+1]
                init_names[j+1]=t
            }
}

class Card
{
    
    constructor()
    {
        this.color=colors[Math.floor(Math.random()*4)];
        this.figure=figures[Math.floor(Math.random()*13)];
        if(Math.random()<3/53)
        {
            this.figure='JOKER'
            this.color=''
        }
    }

    static compare(a,b)
    {
        if(figures.findIndex(function(val){return val==a.figure})>figures.findIndex(function(val){return val==b.figure}))
            return -1
        else if(figures.findIndex(function(val){return val==a.figure})<figures.findIndex(function(val){return val==b.figure}))
            return 1
        else
            if(colors.findIndex(function(val){return val==a.color})>colors.findIndex(function(val){return val==b.color}))
                return -1
            else
                return 1
    }
}