

const CATEGORY_RULES: Record<string, RegExp[]> = {
  "Travel": [
    /booking\.com|\bhotel\b|hostel|airbnb|agoda|trivago/i,
    /airline|flight/i,
    /qantas|virgin\s?austr|jetstar|asiana\s?air/i,
    /\basiana\b(?!.*chatswood)/i,
    /korean\s?air/i,
    /united\s?air/i,
    /thai\s?air/i,
    /finnair/i,
    /scarborough/i,
    /yarra\s?valley/i,
    /flyscoot|scoot\.com/i,
    /marriott?/i,
    /novotel/i,
    /peninsula\s?hot/i,
    /balgownie/i,
    /immigration|igms/i,
    /k-?eta/i,
    /kakaomobility|eksim\s?bay|eximbay/i,
    /maria\s?island/i,
    /troll\.is|troll\s?expedition/i,
    /viator/i,
    /lava\s?show/i,
    /vfs\s?(?:service|global)/i,
    /duty\s?free/i,
    /rammagerdin/i,
    /icelandia/i,
    /fivp\s?hel|general\s?stor/i,
    /point\s?south|kef\s?point/i,
    /island\s?duty\s?free/i,
    /whsmith/i,
    /australian\s?way/i,
    /alepa/i,
    /hagkaup/i,
    /\bhsl\b/i,
    /schengen/i,
    /utenriksdepartementet/i,
    /visa\s?up\s?migrat|migration\s?agen/i,
    /amex\s?travel/i,
    /trip\.com/i,
    /expedia/i,
    /\bresort\b/i,
    /heinemann/i,
    /lotte\s?duty|shilla/i,
    /fjallsarlon/i,
    /courtyard/i,
    /peeopildbaimaelieotseo/i,
    /huilraseouljeom/i,
    /jinsang/i,
    /seocho.?dong/i,
    /hongdaeppaegbaji/i,
    /airasia/i,
    /\bemirates\b/i,
    /captain\s?cook/i,
    /travel\s?money/i,
    /goboat/i,
    /four\s?points/i,
    /wilderness\s?vill/i,
    /aust(?:ralian)?\s?federal\s?police/i,
    /cradle\s?mountain/i,
    /lst\s?wilderness/i,
    /wifi\s?onboard/i,
    /hangook\s?airport|co\.?,?\s?ltd\.?\s?hangook/i,
    /\bice\s?cave/i,
    /excess\s?baggage/i,
    /seljalandsfoss/i,
    /thingvellir|thingvollum|thjodg/i,
    /\bstay\s?in\b/i,
    /finspiration/i,
    /\blodge\b/i,
  ],
  "Food & Dining": [
    /uber\s*\*?\s*eats/i,
    /restaurant|cafe|coffee|starbucks|mcdonald|burger|pizza|sushi|\bfood\b|\beat(?:s|ing|ery)\b|dining|diner|donut|taco|kfc|subway|chipotle|wendy|domino|grubhub|doordash|deliveroo|grab\s?food|panda|noodle|thai|chinese|indian|mexican|italian|japanese|lunch|dinner|breakfast|brunch|catering/i,
    /gourmet|kitchen|kitc\b|claypot|wok\b|grill\b|ippudo|ramen|pho\b|curry\b|dim\s?sum|gelato|froyo|frozen\s?yog|vending/i,
    /chicha|boba|bubble\s?tea|milk\s?tea|yo.?chi|creamy\s?tea/i,
    /hungrypanda|hungry\s?panda/i,
    /gong\s?cha|krispy\s?kreme|tea\s?shop|ms\s?tea/i,
    /sashimi|waterview|east\s?west\s?cafe|quad\s?cafe|veeraphan|red\s?wok|fujiyama/i,
    /khao\s?kang/i,
    /yappari|steak/i,
    /v\s?bar/i,
    /chatime|cha\s?time/i,
    /mixue/i,
    /ho\s?jiak|zlramah/i,
    /pork\s?rol/i,
    /hi\s?q\s?japan/i,
    /cantaloupe\s?systems/i,
    /asiana\s?chatswood/i,
    /nhat\s?truong/i,
    /pbs\s?chatswood/i,
    /tgi\s?friday/i,
    /siroo/i,
    /motto(?:south)?/i,
    /mikazuki/i,
    /yori\s?yori/i,
    /boost\s?juice/i,
    /godiva/i,
    /kamakura/i,
    /spago/i,
    /steve\s?phu/i,
    /coco\s?town/i,
    /15cenchi/i,
    /everstone/i,
    /irvins/i,
    /ringo\s?australia/i,
    /mumu\s?family/i,
    /al\s?gourme(?:n)?t/i,
    /chocolate\s?(?:&|and)\s?gela/i,
    /superb\s?sunny/i,
    /district\s?1/i,
    /the\s?ching/i,
    /beautea/i,
    /machi\s?machi/i,
    /nana.*green\s?tea/i,
    /threefold/i,
    /san\s?churro/i,
    /homm\s?dessert|\bhomm\b/i,
    /breadtop/i,
    /sweet\s?lu/i,
    /sharetea/i,
    /shougun/i,
    /\bomi\b.*chatswood|chatswood.*\bomi\b/i,
    /khao\s?pla/i,
    /stonebowl/i,
    /dopa\s?donburi|\bdopa\b/i,
    /zhangliang|ma\s?la\s?tang/i,
    /hurricane/i,
    /\bgami\b/i,
    /yayoi/i,
    /chicken\s?v\b/i,
    /pancakes?\s?on\s?the/i,
    /myeong.?dong/i,
    /el\s?camino/i,
    /mamak/i,
    /w\s?chatswood\s?pty/i,
    /sq\s?\*/i,
    /sweet\s?monster/i,
    /billy.*chips/i,
    /mr\s?hotpot/i,
    /miss\s?coconut/i,
    /\bcoco\b/i,
    /o\s?chicken/i,
    /de\s?zhuang/i,
    /triple\s?tree/i,
    /missing\s?spoon/i,
    /mokomoko|moko\s?moko/i,
    /pepper\s?lunch/i,
    /menulog/i,
    /\bbistro\b/i,
    /\bbbq\b/i,
    /\bkyue\b/i,
    /viet\s?senses/i,
    /super\s?orange/i,
    /yokocho/i,
    /phood/i,
    /myongdong|myeongdong|myeong.?dong/i,
    /inase\s?sakaba/i,
    /\bat\s?bangkok/i,
    /kim\s?(?:&|and)\s?jung/i,
    /brass\s?australia/i,
    /\bvolpino\b/i,
    /\bbornga\b/i,
    /sk\s?strathfield/i,
    /bangkok\s?on\s?walker/i,
    /king\s?d[ny]/i,
    /\bkintaro\b/i,
    /mae\s?cheng/i,
    /khao\s?san|khaosan/i,
    /\bkumadon\b/i,
    /\byangga\b/i,
    /\bnandos?\b/i,
    /lam\s?f\s?n\s?b/i,
    /yatai\s?ozeki/i,
    /\btenkomori\b/i,
    /lyw\s?chatswood/i,
    /bibim\s?bowl/i,
    /bon\s?pollo/i,
    /\bgyg\b/i,
    /melin\s?bento/i,
    /the?\s?pork\s?bun/i,
    /woodaepobllek/i,
    /gapanjeon/i,
    /kalra\s?seoul/i,
    /leura\s?garage/i,
    /lumos\s?one/i,
    /tiger\s?sugar/i,
    /\bgotcha\b/i,
    /happy\s?lemon/i,
    /\byifang\b/i,
    /\bheytea\b/i,
    /\bknitcha\b/i,
    /auntie\s?sweetie/i,
    /milk\s?flower/i,
    /uncle\s?tetsu/i,
    /smelly\s?cheesecake/i,
    /\bcolotako\b/i,
    /rolling\s?ice/i,
    /lily\s?chatswood/i,
    /sp\s?mooed/i,
    /semaphore\s?ice/i,
    /smack\s?me/i,
    /crepe\s?addict/i,
    /\bbengong\b/i,
    /kokobeobeulti/i,
    /omg\s?station/i,
    /xia\s?group/i,
    /hungry\s?jacks?/i,
    /agnes\s?bakery/i,
    /\broll'?d\b|zlr\*?roll/i,
    /destination\s?roll/i,
    /soul\s?origin/i,
    /arbory\s?afloat/i,
    /black\s?rabbit/i,
    /palermo\s?city/i,
    /spicy\s?joint/i,
    /this\s?way\s?canteen/i,
    /cali\s?press/i,
    /two\s?peck/i,
    /go\s?go\s?yaki/i,
    /sakura\s?chatswood/i,
    /zlr\*?chatswood|zlr\*?city|zlr\*?s3popup/i,
    /\bcarousel\b/i,
    /delaware\s?north/i,
    /tyrrells?\s?vineyard/i,
    /kim\s?(?:&|and)\s?kim/i,
    /old\s?town\s?delight/i,
    /prempree/i,
    /haibin\s?xiao/i,
    /furanochi/i,
    /churros?\s?la\s?flamenca/i,
    /seven\s?treasures/i,
    /alh\s?venues|the\s?corso/i,
    /jhc\s?chatswood/i,
    /\bblu\.?\s?chatswood/i,
    /lister\s?capital|sugarian/i,
    /t2y\s?group/i,
    /sue\s?shiko/i,
    /think\s?sydney/i,
    /mookyokoo/i,
    /joosikhwesa|empllei/i,
    /gong[\s-]?cha\s?hongik/i,
    /klimbilra/i,
    /everyones?\s?dalkom/i,
    /hyeonjangbalgueon/i,
    /joosikhoisa|\bhbaf\b/i,
    /maiseuteoinbeoiseuteujoos/i,
    /ice\s?kirin/i,
    /jcmi\s?investment/i,
    /hmt\s?pty/i,
    /tangerpay/i,
    // — AU food chains —
    /guzman\s?y?\s?gomez/i,
    /red\s?rooster/i,
    /\boporto\b/i,
    /grill['']?d/i,
    /\bzambrero\b/i,
    /\bschnitz\b/i,
    /betty'?s?\s?burger/i,
    /\brashays\b/i,
    /mad\s?mex/i,
    /oliver\s?brown/i,
    /sumo\s?salad/i,
    /noodle\s?box/i,
    /pie\s?face/i,
    /lord\s?of\s?the\s?fries/i,
    /\bogalo\b/i,
    /chargrill\s?charlie/i,
    /chicken\s?treat/i,
    /sushi\s?hub/i,
    /zeus\s?(?:street|greek)/i,
    /ribs?\s?(?:&|and)\s?burger/i,
    /\bfishbowl\b/i,
    /gloria\s?jean/i,
    /coffee\s?club/i,
    /jamaica\s?blue/i,
    /hudson'?s?\s?coffee/i,
    /zarraff?a/i,
    /michel'?s?\s?patiss/i,
    /pancake\s?parlour/i,
    /bucking\s?bull/i,
    /jimmy\s?grant/i,
    /muffin\s?break/i,
    /baker'?s?\s?delight/i,
    /brumb(?:y'?s?|ies)/i,
    /donut\s?king/i,
    /baskin\s?robbins/i,
    /\bsizzler\b/i,
    // — TH food chains —
    /\bmk\s?(?:restaurant|suki|rest)\b/i,
    /bar[\s-]?b[\s-]?q\s?plaza/i,
    /\bfuji\s?rest/i,
    /\bshabushi\b/i,
    /bon\s?chon/i,
    /after\s?you\b/i,
    /snp\s?food/i,
    /pizza\s?company/i,
    /\bswensen/i,
    /dairy\s?queen/i,
    /\boishi\b/i,
    /coco\s?ichiban/i,
    /\byoshinoya\b/i,
    /greyhound\s?cafe/i,
    /black\s?canyon/i,
    /mos\s?burger/i,
    /cafe\s?amazon/i,
    /\binthanin\b/i,
    /\bwawee\b/i,
    /\bpunthai\b/i,
    /chao\s?doi/i,
    /tom\s?n\s?toms?/i,
    // — Food delivery (TH) —
    /grab\s?\*?\s?food|grabfood/i,
    /foodpanda|food\s?panda/i,
    /line\s?man\b|lineman/i,
    // — Generic food keywords —
    /\bbakery\b/i,
    /\bfrozen\s?yogh?urt/i,
    /\bsoup\b/i,
    /\bjuice\b/i,
    /tea\s?house|\bteahouse\b/i,
    /kaffi\b/i,
    /veitinga/i,
    /\bdeig\b/i,
    /\btrattoria\b/i,
    /\bpizzeria\b/i,
    /\btavern\b/i,
    /\bcanteen\b/i,
    /\bbrasserie\b/i,
    // — International food merchants —
    /fire\s?tiger/i,
    /bee\s?cheng\s?hiang/i,
    /\bs\s*&\s*p\b/i,
    /fridheimar/i,
    /superhungry/i,
    /moss\s?piglet/i,
    /\bmenam\b/i,
    /le\s?kock/i,
    /\bijooz\b/i,
    /m\.k\.?\s?suki/i,
  ],
  "Groceries": [
    /grocery|supermarket|walmart|costco|trader|whole\s?foods|aldi|lidl|kroger|safeway|publix|big\s?c|tesco|makro|tops|7-?eleven|\bmarket\b|minimart|fresh/i,
    /woolworth|coles|iga\b|harris\s?farm/i,
    /grocer/i,
    /butcher(?:y|s)?/i,
    /young\s?mart/i,
    /monkey\s?king/i,
    /mido\s?mart/i,
    /tong\s?li/i,
    /asian\s?point/i,
    /superette/i,
    /wuming/i,
    /joy\s?mart/i,
    /broadway\s?trading/i,
    /ezymart/i,
    /newsagent/i,
    /citisuper/i,
    /greenwood\s?plaza/i,
    /red\s?bottle/i,
    /seri\s?world/i,
    /chatswood\s?seafood|atlantic\s?seafood/i,
    /miracle\s?chatswood/i,
    /\bssiyu\b|\bcu\b.*convenience/i,
    // — AU grocery chains —
    /foodworks/i,
    /drakes\s?s?(?:uper)?market|(?:^|\s)drakes(?:\s|$)/i,
    /spudshed/i,
    /iga\s?x-?press/i,
    /farmer\s?jacks?/i,
    // — TH grocery / convenience —
    /\bcp\s?all\b|cpall/i,
    /family\s?mart/i,
    /lawson\s?108/i,
    /mini\s?big\s?c/i,
    /cj\s?(?:express|more)/i,
    /\blotus(?:'?s)?\b|ek[\s-]?chai/i,
    /gourmet\s?market/i,
    /villa\s?market/i,
    /max\s?valu/i,
    /cp\s?fresh/i,
    /central\s?food\s?hall/i,
    // — Iceland grocery —
    /\bkronan\b/i,
    // — SG / generic convenience —
    /everyday\s?mart/i,
    /\bmart\b/i,
  ],
  "Transport": [
    /uber(?!\s*\*?\s*eats)|lyft|grab(?!\s?food)|taxi|fuel|gas\s?station|petrol|shell|chevron|bp\b|parking|toll|transit|metro|bus\b|train\b|railway|airport|car\s?wash|auto\s?repair|mechanic|tire/i,
    /transport(?!.*fee)|opal|myki|gocard|translink/i,
    /didimobility|didi\b|didichuxing|didiau/i,
    /nnn\s?international/i,
    /interchange\s?7/i,
    /\blime\b/i,
    /\bbeam\b/i,
    /\bcab\b/i,
    // — AU fuel / tolls / parking —
    /\bampol\b/i,
    /\bcaltex\b/i,
    /united\s?petrol/i,
    /puma\s?energy/i,
    /metro\s?petrol/i,
    /\blinkt\b|roam\s?express|go\s?via|\btransurban\b/i,
    /e-?toll/i,
    /wilson\s?park/i,
    /secure\s?park/i,
    /care\s?park/i,
    /\bgoget\b/i,
    /supercheap\s?auto/i,
    /\brepco\b/i,
    /\bautobarn\b/i,
    /\bservo\b/i,
    // — TH transport —
    /\bbts\b|\brabbit\s?card/i,
    /\bmrt\b|\bbem\b/i,
    /bolt\.eu/i,
    /\bexat\b|easy\s?pass|m[\s-]?pass/i,
    /\bptt(?:st)?/i,
    /\bbangchak\b/i,
    /\bindrive\b/i,
    // — Car rental (global) —
    /car\s?rental|rent[\s-]?a[\s-]?car/i,
    /\bsixt\b|sixt\d/i,
    /\bhertz\b/i,
    /\bavis\b/i,
    /\beuropcar\b/i,
    // — Iceland fuel / tolls —
    /\bn1\s+\w/i,
    /\borkan\b/i,
    // — Generic toll keywords —
    /\bexpressway\b/i,
  ],
  "Shopping": [
    /amazon(?!.*prime)|ebay|shopee|lazada|etsy|mall|shop(?:ping)?|store|retail|fashion|cloth|apparel|shoe|nike|adidas|zara|h&m|uniqlo|ikea|home\s?depot|lowes|best\s?buy|apple\s?store|electronics/i,
    /aliexpress|alibaba|temu|marketplace|wish\.com/i,
    /\bw\s+retail\b/i,
    /mumu\s?life/i,
    /sy\s?jung|naya\s?aus/i,
    /daiso/i,
    /macpac/i,
    /ddk\s?trading/i,
    /kmart/i,
    /pop\s?mart/i,
    /\bdji\b/i,
    /pitaka/i,
    /hype\s?online/i,
    /jb\s?hi[\s-]?fi/i,
    /kogan/i,
    /samsonite/i,
    /david\s?jones/i,
    /\bbig\s?w\b/i,
    /tk\s?maxx/i,
    /jay\s?jays?/i,
    /jd[_\s]australia|jd\s?sports/i,
    /miniso/i,
    /paris\s?miki/i,
    /owndays/i,
    /olive\s?young/i,
    /eb\s?games/i,
    /\bmuji\b/i,
    /\btarget\b/i,
    /mecca\s?brand/i,
    /\blush\b/i,
    /body\s?shop/i,
    /mwave/i,
    /bing\s?lee/i,
    /officeworks/i,
    /\bsamsung\b/i,
    /cotton\s?on/i,
    /lululemon/i,
    /\blego\b/i,
    /myer\b/i,
    /flmax|maxmara/i,
    /blueanise/i,
    /westfield/i,
    /macquarie\s?centre/i,
    /\bshein\b/i,
    /\bsuperdry\b/i,
    /\binditex\b/i,
    /\bsupre\b/i,
    /just\s?jeans/i,
    /\basos\b/i,
    /north\s?face/i,
    /\bchampion\b/i,
    /\bkathmandu\b/i,
    /foot\s?locker/i,
    /\basics\b/i,
    /\brebel\b/i,
    /coach\s?birkenhead/i,
    /\bpandora\b/i,
    /\baesop\b/i,
    /\binnisfree\b/i,
    /\banaconda\b/i,
    /everrun/i,
    /bensons?\s?trading/i,
    /\bglobale?\b/i,
    /teds?\s?camera/i,
    /innovative\s?retail/i,
    /bmc\s?venture/i,
    /interchange\s?trading/i,
    /\bmitzu\b/i,
    /\bnextra\b/i,
    /ams\s?dfo/i,
    /lotdaeworld|lotte\s?world(?!.*duty)/i,
    /eichidissiaipakeumol/i,
    /sp\s?hero\s?stash/i,
    /\boculus\b/i,
    /\bnintendo\b/i,
    /\bblu\.\s?\d/i,
    // — AU shopping —
    /\bbunnings\b/i,
    /harvey\s?norman/i,
    /fantastic\s?furn/i,
    /\bamart\b/i,
    /freedom\s?furn/i,
    /nick\s?scali/i,
    /beacon\s?light/i,
    /good\s?guys/i,
    /\bbcf\b/i,
    /\bspotlight\b/i,
    /\badairs\b/i,
    /bed\s?bath\s?n?\s?table/i,
    /\bsephora\b/i,
    /\bdecathlon\b/i,
    /dan\s?murphy/i,
    /\bbws\b/i,
    /liquorland/i,
    /first\s?choice\s?liquor/i,
    /vintage\s?cellar/i,
    /jimmy\s?brings/i,
    /\bhardware\b/i,
    /\bflorist\b/i,
    // — TH shopping —
    /\bcentral\s?(?:dept|world|plaza)\b/i,
    /\brobinson\b/i,
    /\bsiam\s?paragon/i,
    /\bemporium\b|\bemquartier\b/i,
    /terminal\s?21/i,
    /iconsiam|icon\s?siam/i,
    /\bmbk\s?(?:center)?\b/i,
    /home\s?pro\b|homepro/i,
    /thai\s?watsadu|thaiwatsadu/i,
    /do\s?home\b|dohome/i,
    /global\s?house/i,
    /boonthavorn/i,
    /power\s?buy|powerbuy/i,
    /banana\s?it|\bbnn\b/i,
    /studio\s?7\b/i,
    /it\s?city\b/i,
    /jay\s?mart/i,
    /super\s?sports/i,
    /\bb2s\b/i,
    /office\s?mate/i,
    /\bwatsons?\b/i,
    /\bboots\b/i,
    /jd\s?central/i,
    // — International fashion / retail —
    /\bglassons?\b/i,
    /\bicewear\b/i,
    /str\*?\s?parka|\bparka\b/i,
    /\bpenninn\b/i,
  ],
  "Bills & Utilities": [
    /electric|water\s?bill|gas\s?bill|internet|wifi|broadband|phone\s?bill|mobile\s?plan|cable|utilit(?:y|ies)|garbage|sewage|municipal|city\s?of|power|energy/i,
    /optus|telstra|vodafone|nbn\b|iinet|tpg\b|billing|telecom/i,
    /overseas\s*(?:transaction\s*)?fee|(?:annual|monthly|late|service)\s*fee|surcharge/i,
    /sydney\s?water|hunter\s?water|sa\s?water/i,
    /eziabacus|storage\s?oper/i,
    /service\s?nsw/i,
    /tax7|accountant/i,
    /annual\s?charge/i,
    /au\s?post|\bpost\s?chatswood/i,
    /h\s?and\s?r\s?block/i,
    /tangerine/i,
    /\bcouncil\b/i,
    /international\s?transaction\s?fee/i,
    /account\s?fee/i,
    /\bsweep\b/i,
    /shopback/i,
    /origin\s?energy/i,
    // — AU utilities / telco —
    /\bagl\b/i,
    /energy\s?australia/i,
    /alinta/i,
    /red\s?energy/i,
    /lumo\s?energy/i,
    /simply\s?energy|\bengie\b/i,
    /powershop/i,
    /actew/i,
    /\bergon\b/i,
    /ausgrid/i,
    /aussie\s?broadband|aussie\s?bb/i,
    /\bbelong\b/i,
    /amaysim/i,
    /boost\s?mobile/i,
    /\blebara\b/i,
    /\bfoxtel\b/i,
    /fetch\s?tv/i,
    // — TH utilities / telco —
    /metropolitan\s?electric|\bgfn\b/i,
    /provincial\s?electric|\bgfp\b/i,
    /metropolitan\s?waterworks/i,
    /provincial\s?waterworks/i,
    /\bais\b|advanced\s?info/i,
    /true\s?(?:move|corp|online)/i,
    /\bdtac\b/i,
    /\b3bb\b|three\s?bb/i,
    /national\s?telecom|\btot\b|\bcat\s?telecom/i,
    /counter\s?service/i,
    /true\s?money/i,
  ],
  "Subscriptions": [
    /netflix|spotify|youtube|disney|hbo|hulu|apple\s?music|amazon\s?prime|subscri?(?:ption|b)/i,
    /membership|gym|fitness/i,
    /adobe|microsoft\s?365|icloud|dropbox|github|notion|slack/i,
    /openai|chatgpt|anthropic|audible|kindle|linkedin|x\s+corp|twitter/i,
    /hubbl|binge|stan\b|kayo|paramount\+?|crunchyroll|funimation/i,
    /whoop/i,
    /godaddy/i,
    /elevenlabs/i,
    /canva/i,
    /cloudflare/i,
    /capcut/i,
    /prime\s?video/i,
    /\bmicrosoft\b/i,
    /\budemy\b/i,
    /midjourney/i,
    /google\s?storage/i,
    /cleverbridge/i,
    /dri\*?gallup/i,
    /medium\s?annual/i,
    /help\.max/i,
    /2c2p/i,
    /dg\*?rom/i,
    /skneteuueokseu/i,
    // — AU gym / fitness —
    /anytime\s?fitness/i,
    /\bf45\b/i,
    /\bjetts\b/i,
    /fitness\s?first/i,
    /plus\s?fitness/i,
    /goodlife/i,
    // — TH subscriptions —
    /true\s?id/i,
    /ais\s?play/i,
    /\bviu\b/i,
    /\bwetv\b/i,
    /\bmeb\b/i,
  ],
  "Housing": [
    /rent\b|mortgage|lease|property|condo|apartment|housing|hoa\b|home\s?insurance|real\s?estate/i,
    /stratapay|strata\s?pay/i,
    /eva\s?mattress|sp\s?eva/i,
    /origin\s?sleep/i,
    /nsw\s?rental\s?bond/i,
  ],
  "Health": [
    /hospital|clinic|doctor|dental|dentist|pharmacy|drug\s?store|cvs|walgreens|medical|health|insurance\s?premium|lab\b|therapy|mental\s?health|vision|optical/i,
    /chemist\s?warehouse|priceline\s?pharmacy|terry\s?white|amcal/i,
    /pline(?:\s?ph)?/i,
    /nth\s?shore\s?ent/i,
    /remedy\s?laser/i,
    /golf\s?start/i,
    /speedo/i,
    /\bchemist\b/i,
    /st\s?andrews?/i,
    /bjc\s?health/i,
    /twc\s?chatswood/i,
    /massage/i,
    /\bspa\b/i,
    /\bcwh\b/i,
    /katherine\s?street/i,
    /luxottica/i,
    /nxchem/i,
    /mr\s?vitamins/i,
    /arctic\s?white/i,
    /alpha\s?beta\s?australia/i,
    // — AU health —
    /blooms?\s?(?:chemist|pharm)/i,
    /discount\s?drug/i,
    /national\s?pharmac/i,
    /specsavers/i,
    /\bopsm\b/i,
    /\bphysio\b/i,
    /\bpathology\b/i,
    /\bchiro\b/i,
    /\bosteo\b/i,
    /\bpsych\b/i,
    // — TH hospitals —
    /bumrungrad/i,
    /samitivej/i,
    /bangkok\s?hospital|\bbdms\b/i,
    /\bbnh\s?(?:hospital)?\b/i,
    /phyathai|piyavate/i,
    /saint\s?louis|st\s?louis/i,
    /\bpaolo\b/i,
    /thonburi\s?(?:hospital)?/i,
    /ramkhamhaeng|ram\s?hospital/i,
    /dusit\s?med/i,
    /pornkasem/i,
  ],
  "Entertainment": [
    /movie|cinema|theater|concert|ticket|game|gaming|steam|playstation|xbox|amusement|park\b|zoo|museum|bowling|karaoke/i,
    /bar\b|pub\b|club\b|alcohol|beer|wine|liquor/i,
    /ice\s?rink|skating|rink\b|arcade/i,
    /lawson\s?ticket/i,
    /ticket\s*board/i,
    /film\s?fest/i,
    /currumbin/i,
    /ripleys?|ripley/i,
    /dreamworld/i,
    /phillip\s?island/i,
    /port\s?arthur/i,
    /cj\s?cgv|\bcgv\b/i,
    /lee\s?byung\s?hun/i,
    /\bmegabox\b/i,
    /event\s+george/i,
    /scenic\s?world/i,
    /\btaronga\b/i,
    /sea\s?life/i,
    /moonlit\s?sanctuary/i,
    /hunter\s?valley\s?garden/i,
    /blue\s?mountains?\s?city/i,
    /echo\s?point/i,
    /parks?\s?cradle/i,
    /nxt.*easter/i,
    /\bvrtp\b/i,
    /top\s?serve\s?tennis/i,
    /ezi\*?lane\s?cove\s?golf/i,
    /puffing\s?billy/i,
    // — TH entertainment —
    /major\s?(?:cineplex|cinema)/i,
    /sf\s?(?:cinema|cine)/i,
    /fossil\s*(?:&|and)\s*frame/i,
  ],
  "Education": [
    /school|university|college|tuition|course|class\b|coursera|\bbooks?\b|textbook|education|learning|training|certification|exam/i,
    /rosetta\s?stone/i,
    // — AU education —
    /\btafe\b/i,
    /goodstart/i,
  ],
  "Transfer": [
    /transfer|zelle|venmo|paypal|wire|remittance|sent\s?to|received\s?from|p2p/i,
    /investment\s?group|acf\s?investment/i,
    /\bamex\b|american\s?express/i,
    /card\s?(?:repayment|payment)/i,
    /autopay/i,
    /osko|payid|pay\s?id/i,
    /\bwise\b.*sydney|wise\s?(?:au|sydney)/i,
    // — BNPL repayments —
    /afterpay/i,
    /zip\s?(?:pay|money)/i,
    /\bhumm\b|shophumm/i,
    /latitude\s?pay/i,
    /\bklarna\b/i,
  ],
  "Income": [
    /salary|payroll|deposit|wage|bonus|dividend|interest\s?earned|refund|reimbursement|cashback|cash\s?back|reward/i,
  ],
  "Insurance": [
    /insurance|premium|coverage|geico|allstate|state\s?farm|progressive|policy/i,
    /allianz|inter\s+partner\s+assist/i,
    /gu\s?health/i,
    /\bbupa\b/i,
    /medibank/i,
    /\bnib\b/i,
    // — AU insurance —
    /\bnrma\b/i,
    /\baami\b/i,
    /\bsuncorp\b/i,
    /\bracv\b/i,
    /\bracq\b/i,
    /\bqbe\b/i,
    /\bgio\b/i,
    /\bcgu\b/i,
    /\byoui\b/i,
    /budget\s?direct/i,
    /\bhcf\b/i,
    /\bahm\b/i,
    /aust(?:ralian)?\s?unity/i,
    // — TH insurance —
    /muang\s?thai/i,
    /bangkok\s?insurance|\bbki\b/i,
    /viriyah/i,
    /thai\s?life|\btli\b/i,
    /\baia(?:th)?\b/i,
    /\bfwd\b/i,
    /\bprudential\b/i,
    /allianz\s?ayudhya/i,
    /tokio\s?marine/i,
    /krungthai[\s-]?axa|\bktaxa\b/i,
  ],
  "Personal Care": [
    /salon|barber|beauty|cosmetic|skincare|nail\b|hair\b/i,
    /fancy\s?life/i,
    /l'?oreal/i,
    /just\s?cuts/i,
  ],
  "Pets": [
    /pet(?:s)?\b|vet\b|veterinary|animal|dog\b|cat\b|petco|petsmart/i,
    /pet\s?barn/i,
    /pet\s?stock/i,
    /city\s?farmer/i,
    /best\s?friends?\s?pet/i,
    /greencross/i,
    /\brspca\b/i,
  ],
  "Charity": [
    /unicef/i,
    /karphaga|vinayak/i,
    /archdiocese/i,
    /shout\s?for\s?good/i,
    /marist/i,
    /\btrustees?\b/i,
    /chatswood\s?parish/i,
    /st\s?paul(?:s|'s)?\s?cathedral/i,
    // — AU charities —
    /world\s?vision/i,
    /salvation\s?army|\bsalvo/i,
    /red\s?cross/i,
    /smith\s?family/i,
    /\boxfam\b/i,
    /beyond\s?blue/i,
    /fred\s?hollows/i,
    /cancer\s?council/i,
  ],
};

export function categorizeTransaction(description: string, amount?: number): string {
  const cleaned = description.trim();

  // GU HEALTH / Bupa / Medibank / NIB → Insurance (before broad Health match)
  if (/gu\s?health|\bbupa\b|medibank|\bnib\b/i.test(cleaned)) {
    return "Insurance";
  }

  // APPLE.COM/BILL = iCloud, Apple One, AppleCare → always Subscriptions
  if (/apple[.\s]+com\/bill/i.test(cleaned)) {
    return "Subscriptions";
  }

  // Apple.com or Apple Com/Au: large purchases (>$200) are hardware, smaller ones are services/subscriptions
  if (/apple[.\s]+com/i.test(cleaned)) {
    return Math.abs(amount ?? 0) > 200 ? "Shopping" : "Subscriptions";
  }

  // Nintendo: Gaming purchases → Shopping (prevent "ESHOP" matching generic Shopping catch-all)
  if (/\bnintendo\b/i.test(cleaned)) {
    return "Shopping";
  }

  // LGC*UBER GIFTCARD → Shopping (not Transport)
  if (/lgc\*?uber\s?gift/i.test(cleaned)) {
    return "Shopping";
  }

  // ATM cash withdrawal → Other (subcategory: Cash Withdrawal)
  if (/\batm\b/i.test(cleaned)) {
    return "Other";
  }

  // Apple physical retail stores (R + store number): high amounts → Shopping, low → Subscriptions
  if (/\bapple\s?r\d/i.test(cleaned)) {
    return Math.abs(amount ?? 0) > 200 ? "Shopping" : "Subscriptions";
  }

  // Coin laundry → Other (subcategory: Laundry)
  if (/coin\s?laund/i.test(cleaned)) {
    return "Other";
  }

  // Microsoft Store → Subscriptions (before Shopping's generic "store" catches it)
  if (/microsoft\*?store/i.test(cleaned)) {
    return "Subscriptions";
  }

  // VRTP (Village Roadshow Theme Parks) → Entertainment
  if (/\bvrtp\b/i.test(cleaned)) {
    return "Entertainment";
  }

  // Amazon Prime membership → Subscriptions
  if (/amazon.*prime/i.test(cleaned)) {
    return "Subscriptions";
  }

  // Google Store (Pixel, Nest etc.) → Shopping
  if (/google\*?google\s?store/i.test(cleaned)) {
    return "Shopping";
  }

  // Teds Camera → Shopping
  if (/teds?\s?camera/i.test(cleaned)) {
    return "Shopping";
  }

  // ── AU/TH conflict pre-checks ──
  // These merchants contain generic keywords (thai, metro, gourmet, health,
  // vision, store, shop) that would be caught by earlier broad patterns.
  if (/thaiwatsadu|thai\s?watsadu/i.test(cleaned)) return "Shopping";
  if (/gourmet\s?market/i.test(cleaned)) return "Groceries";
  if (/villa\s?market/i.test(cleaned)) return "Groceries";
  if (/central\s?food\s?hall/i.test(cleaned)) return "Groceries";
  if (/metropolitan\s?electric/i.test(cleaned)) return "Bills & Utilities";
  if (/provincial\s?electric/i.test(cleaned)) return "Bills & Utilities";
  if (/metropolitan\s?waterworks/i.test(cleaned)) return "Bills & Utilities";
  if (/provincial\s?waterworks/i.test(cleaned)) return "Bills & Utilities";
  if (/phyathai|piyavate/i.test(cleaned)) return "Health";
  if (/bumrungrad|samitivej|bangkok\s?(?:hospital|dusit)|\bbdms\b/i.test(cleaned)) return "Health";
  if (/ramkhamhaeng|ram\s?hospital/i.test(cleaned)) return "Health";
  if (/muang\s?thai/i.test(cleaned)) return "Insurance";
  if (/bangkok\s?insurance|\bbki\b/i.test(cleaned)) return "Insurance";
  if (/thai\s?life|\btli\b/i.test(cleaned)) return "Insurance";
  if (/\bhcf\b/i.test(cleaned)) return "Insurance";
  if (/\baia\b/i.test(cleaned)) return "Insurance";
  if (/\bfwd\b/i.test(cleaned)) return "Insurance";
  if (/\bnrma\b|\baami\b|\bsuncorp\b/i.test(cleaned)) return "Insurance";
  if (/\bracv\b|\bracq\b|\bqbe\b/i.test(cleaned)) return "Insurance";
  if (/\byoui\b|budget\s?direct/i.test(cleaned)) return "Insurance";
  if (/\bahm\b|aust(?:ralian)?\s?unity/i.test(cleaned)) return "Insurance";
  if (/viriyah/i.test(cleaned)) return "Insurance";
  if (/prudential/i.test(cleaned)) return "Insurance";
  if (/tokio\s?marine/i.test(cleaned)) return "Insurance";
  if (/krungthai[\s-]?axa|\bktaxa\b/i.test(cleaned)) return "Insurance";
  if (/discount\s?drug/i.test(cleaned)) return "Health";
  if (/national\s?pharmac/i.test(cleaned)) return "Health";
  if (/world\s?vision/i.test(cleaned)) return "Charity";
  if (/red\s?cross/i.test(cleaned)) return "Charity";
  if (/smith\s?family/i.test(cleaned)) return "Charity";
  if (/beyond\s?blue/i.test(cleaned)) return "Charity";
  if (/cancer\s?council/i.test(cleaned)) return "Charity";
  if (/fred\s?hollows/i.test(cleaned)) return "Charity";
  if (/salvation\s?army|\bsalvo/i.test(cleaned)) return "Charity";
  if (/shophumm|\bhumm\b/i.test(cleaned)) return "Transfer";
  if (/afterpay/i.test(cleaned)) return "Transfer";

  // ── Transfer intent decoder ──
  // Bank transfers ("Transfer To [PAYEE]... [MEMO]") carry intent in the memo.
  // Decode the purpose instead of blanket-categorizing as Transfer.
  if (/\btransfer\b/i.test(cleaned)) {
    // P1: Credit card repayments → Transfer (excluded from spending totals)
    if (/\bamex\b|american\s?express|hsbc\s?card|card\s?(?:repayment|payment)|autopay/i.test(cleaned)) {
      return "Transfer";
    }
    // P1b: Internal transfers (savings, test, deposit to own account, transfer to/from account numbers)
    if (/\bsaving\b|\btest\b/i.test(cleaned) || /transfer\s+(?:to|from)\s+xx\d/i.test(cleaned)) {
      return "Transfer";
    }
    // P2: Housing / Rent
    if (/\brent(?:al)?\b|bonding\s?house|relocat/i.test(cleaned)) {
      return "Housing";
    }
    // P3: Lifestyle intent from memo keywords
    // Food & Dining
    if (/\bfo{1,}d\b|\bshabu|\bwagyu|\bdessert|\bauntie\b|\bdinner\b|\blunch\b|\beat\b|\bbrunch\b|\bbreakfast\b|\bmeal\b/i.test(cleaned)) {
      return "Food & Dining";
    }
    if (/\bsushi\b|\bsashimi\b|\bramen\b|\bpizza\b|\bnoodle\b|\bburger\b|\bchicken\b|\bcurry\b|\bpho\b/i.test(cleaned)) {
      return "Food & Dining";
    }
    if (/\btgif\b|\bbbq\b|\bhotpot\b|\bsteak\b|\bboba\b|\bcake\b|\bdrink\b|\bjug\b|\bcoffee\b|\bcafe\b/i.test(cleaned)) {
      return "Food & Dining";
    }
    if (/\bdim\s?sum\b|\byum\s?cha\b|\bgelato\b|\bice\s?cream\b|\bbakery\b|\bbread\b|\bpie\b/i.test(cleaned)) {
      return "Food & Dining";
    }
    // Transport
    if (/\bdidi\b|\buber\b|\btrain\b|\btaxi\b|\bbus\b|\bopal\b|\bparking\b|\btoll\b|\bfuel\b|\bpetrol\b|\bgrab\b/i.test(cleaned)) {
      return "Transport";
    }
    // Entertainment
    if (/\bmovie\b|\bbowling\b|\bcinema\b|\bkaraoke\b|\bconcert\b|\bticket\b|\barcade\b|\bbar\b|\bpub\b|\bclub\b/i.test(cleaned)) {
      return "Entertainment";
    }
    if (/\btennis\b|\bgolf\b|\bsinging\b|\bswim(?:ming)?\b|\bfireworks?\b/i.test(cleaned)) {
      return "Entertainment";
    }
    // Personal Care
    if (/\bhair\b|\bclean(?:er|ing)?\b/i.test(cleaned)) {
      return "Personal Care";
    }
    // Shopping (labubu without word boundary so "DepositLabubu" matches)
    if (/\brobot\s?vacu?um?\b|labubu|\bbox(?:es)?\b|\bgoods\b|\bmagnet/i.test(cleaned)) {
      return "Shopping";
    }
    // Travel
    if (/car\s?rental|\bnew\s?zealand|\bnz\s?trip|\badelaide|\bgold\s?coast|\bmelb?(?:ourne)?\b|\btasmania/i.test(cleaned)) {
      return "Travel";
    }
    // Education
    if (/\bschool\b|\btuition\b|\bcourse\b/i.test(cleaned)) {
      return "Education";
    }
    // Professional Services
    if (/\bvisa\b|\bmigration\b|\bconsult/i.test(cleaned)) {
      return "Bills & Utilities";
    }
    // P4: Unrecognized memo → generic Transfer
    return "Transfer";
  }

  // BPAY: credit card payments → Transfer, else fall through to match biller
  if (/\bbpay\b/i.test(cleaned)) {
    if (/hsbc|\bamex\b|american\s?express|\bcard\b/i.test(cleaned)) {
      return "Transfer";
    }
  }

  // Osko/PayID with lifestyle keywords → decode like transfers
  if (/osko|payid|pay\s?id/i.test(cleaned)) {
    if (/dinner|lunch|food|eat|brunch|breakfast|meal|\bshabu|\bwagyu|\bdessert|\bauntie|\bsushi|\bsashimi|\bramen|\bpizza|\bdrink|\bjug|\bcoffee|\bcafe|\bbbq|\bhotpot|\bsteak|\bnoodle|\bburger|\bchicken|\bcurry/i.test(cleaned)) {
      return "Food & Dining";
    }
    if (/\bdidi\b|\buber\b|\btrain\b|\btaxi\b|\bbus\b|\bopal\b/i.test(cleaned)) {
      return "Transport";
    }
    if (/\bmovie\b|\bbowling\b|\bcinema\b|\bkaraoke\b|\bsinging\b/i.test(cleaned)) {
      return "Entertainment";
    }
  }

  for (const [category, patterns] of Object.entries(CATEGORY_RULES)) {
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        return category;
      }
    }
  }

  return "Other";
}

export function getAllCategories(): string[] {
  return [...Object.keys(CATEGORY_RULES), "Other"];
}

// Sub-category rules: main category → array of [subcategory_name, patterns]
// First match wins; if nothing matches, falls to default (see subcategorizeTransaction).
const SUBCATEGORY_RULES: Record<string, [string, RegExp[]][]> = {
  "Food & Dining": [
    ["Cafes / Drinks / Desserts", [
      // Bubble tea / milk tea brands
      /chicha|boba|bubble\s?tea|milk\s?tea|yo.?chi|creamy\s?tea/i,
      /gong[\s-]?cha|chatime|cha\s?time|sharetea|beautea|machi\s?machi|ms\s?tea/i,
      /tiger\s?sugar|\bgotcha\b|happy\s?lemon|\byifang\b|\bheytea\b|\bknitcha\b/i,
      /\bbengong\b|kokobeobeulti|omg\s?station/i,
      /nana.*green\s?tea/i,
      /mixue/i,
      /boost\s?juice/i,
      // Desserts & ice cream
      /krispy\s?kreme|san\s?churro|homm\s?dessert|\bhomm\b|godiva/i,
      /uncle\s?tetsu|smelly\s?cheesecake/i,
      /\bcolotako\b|rolling\s?ice/i,
      /sp\s?mooed|semaphore\s?ice|smack\s?me/i,
      /crepe\s?addict/i,
      /auntie\s?sweetie|milk\s?flower/i,
      /lily\s?chatswood/i,
      /breadtop|sweet\s?lu|sweet\s?monster/i,
      /gelato|froyo|frozen\s?yog|chocolate\s?(?:&|and)\s?gela/i,
      /miss\s?coconut|15cenchi/i,
      /mokomoko|moko\s?moko/i,
      /irvins|billy.*chips/i,
      /xia\s?group/i,
      // Generic cafe/dessert keywords
      /\bcafe\b|coffee|starbucks/i,
      /\bdonut\b/i,
      /ice\s?cream/i,
      /\bcake\b|pastry/i,
      /\bdessert\b/i,
      /tea\s?shop/i,
    ]],
    ["Dining Out", [
      // Everything else in Food & Dining is dining
      /.+/i,
    ]],
  ],
  "Shopping": [
    ["Electronics / Apple", [
      /\bapple\b/i,
      /google\*?google\s?store/i,
      /teds?\s?camera/i,
    ]],
    ["Electronics", [
      /jb\s?hi[\s-]?fi|kogan/i,
      /mwave|bing\s?lee/i,
      /officeworks/i,
      /\bsamsung\b/i,
      /best\s?buy|electronics/i,
    ]],
    ["Gaming", [
      /eb\s?games/i,
      /\bnintendo\b/i,
      /\boculus\b/i,
    ]],
    ["Photography / Drones", [
      /\bdji\b/i,
    ]],
    ["Electronics / Accessories", [
      /pitaka/i,
    ]],
    ["Eyewear", [
      /owndays/i,
      /paris\s?miki/i,
      /\bblu\.\s?\d/i,
    ]],
    ["Shoes", [
      /foot\s?locker/i,
      /\basics\b/i,
      /\bshoe\b/i,
    ]],
    ["Sports & Outdoors", [
      /\brebel\b/i,
      /\banaconda\b/i,
      /macpac/i,
      /\bkathmandu\b/i,
    ]],
    ["Beauty / Skincare / Cosmetics", [
      /\baesop\b|\binnisfree\b/i,
      /mecca\s?brand|\blush\b|olive\s?young|body\s?shop/i,
      /sy\s?jung/i,
    ]],
    ["Bags / Accessories", [
      /coach\s?birkenhead/i,
    ]],
    ["Jewellery", [
      /\bpandora\b/i,
    ]],
    ["Luggage / Travel", [
      /samsonite/i,
    ]],
    ["Home & Living", [
      /ikea|home\s?depot|lowes/i,
      /kmart|\btarget\b|\bbig\s?w\b/i,
      /daiso|miniso/i,
      /bensons?\s?trading/i,
    ]],
    ["Collectibles / Toys", [
      /pop\s?mart/i,
      /\blego\b/i,
      /sp\s?hero\s?stash/i,
    ]],
    ["Lifestyle / Variety", [
      /\bmuji\b/i,
      /mumu\s?life/i,
      /\bnextra\b/i,
      /bmc\s?venture/i,
      /interchange\s?trading/i,
      /\bmitzu\b/i,
      /innovative\s?retail/i,
      /everrun/i,
    ]],
    ["Online Shopping", [
      /amazon/i,
      /aliexpress|alibaba/i,
      /\btemu\b/i,
      /\bebay\b/i,
      /\bshopee\b/i,
      /\blazada\b/i,
      /\bglobale?\b/i,
      /lgc\*?uber\s?gift/i,
      /lotdaeworld|lotte\s?world/i,
      /eichidissiaipakeumol/i,
      /ams\s?dfo/i,
    ]],
    ["Clothing", [
      // Catch-all for remaining Shopping → Clothing
      /.+/i,
    ]],
  ],
  "Travel": [
    ["Flights", [
      /airline|flight/i,
      /qantas|virgin\s?austr|jetstar|asiana\s?air/i,
      /\basiana\b(?!.*chatswood)/i,
      /korean\s?air|united\s?air|thai\s?air|finnair/i,
      /flyscoot|scoot\.com/i,
      /airasia/i,
      /\bemirates\b/i,
    ]],
    ["Hotels & Accommodation", [
      /booking\.com|\bhotel\b|hostel|airbnb|agoda|trivago/i,
      /marriott?|novotel|peninsula\s?hot|balgownie/i,
      /courtyard/i,
      /four\s?points/i,
      /wilderness\s?vill/i,
      /\bresort\b/i,
      /cradle\s?mountain/i,
    ]],
    ["Travel / Tours", [
      /viator|lava\s?show|troll\.is|troll\s?expedition|icelandia/i,
      /maria\s?island/i,
      /fjallsarlon/i,
      /captain\s?cook/i,
      /goboat/i,
      /scarborough|yarra\s?valley/i,
      /aust(?:ralian)?\s?federal\s?police/i,
      /immigration|igms|k-?eta|vfs\s?(?:service|global)|schengen|utenriksdepartementet/i,
      /visa\s?up\s?migrat|migration\s?agen/i,
      /lst\s?wilderness/i,
      /puffing\s?billy/i,
    ]],
    ["Travel Money / FX", [
      /travel\s?money/i,
      /duty\s?free|island\s?duty\s?free/i,
      /heinemann/i,
      /lotte\s?duty|shilla/i,
    ]],
    ["Inflight / Onboard", [
      /wifi\s?onboard/i,
    ]],
    ["Unknown / Review", [
      // Korean travel merchants — hard to identify
      /peeopildbaimaelieotseo/i,
      /huilraseouljeom/i,
      /jinsang/i,
      /seocho.?dong/i,
      /hongdaeppaegbaji/i,
    ]],
  ],
  "Groceries": [
    ["Groceries", [
      /.+/i,
    ]],
  ],
  "Health": [
    ["Optical / Eyecare", [
      /luxottica/i,
      /optical|eyecare|vision/i,
      /wsq\s?eyecare/i,
    ]],
    ["Dental / Health", [
      /arctic\s?white/i,
    ]],
    ["Health / Supplements", [
      /mr\s?vitamins/i,
      /alpha\s?beta\s?australia/i,
      /nxchem/i,
    ]],
    ["Medical / GP", [
      /hospital|clinic|doctor|dental|dentist|medical|lab\b/i,
      /nth\s?shore\s?ent|st\s?andrews?/i,
      /bjc\s?health/i,
      /katherine\s?street/i,
      /\bmedi\b/i,
    ]],
    ["Pharmacy / Health", [
      /pharmacy|drug\s?store|cvs|walgreens|\bchemist\b/i,
      /chemist\s?warehouse|priceline\s?pharmacy|terry\s?white|amcal/i,
      /pline(?:\s?ph)?/i,
      /twc\s?chatswood/i,
      /\bcwh\b/i,
    ]],
    ["Wellness & Fitness", [
      /therapy|mental\s?health|remedy\s?laser/i,
      /massage|\bspa\b/i,
      /golf\s?start|speedo/i,
    ]],
  ],
  "Insurance": [
    ["Subscription / Membership", [
      /gu\s?health|\bbupa\b|medibank|\bnib\b/i,
      /health.*insurance|insurance\s?premium/i,
    ]],
    ["Subscription / Membership", [
      /allianz|inter\s+partner\s+assist/i,
    ]],
    ["Subscription / Membership", [
      /insurance|premium|coverage|geico|allstate|state\s?farm|progressive|policy/i,
    ]],
  ],
  "Transport": [
    ["Transport - Rideshare / Taxi", [
      /uber(?!\s*\*?\s*eats)|lyft|grab(?!\s?food)|taxi/i,
      /didimobility|didi\b|didichuxing|didiau/i,
      /\blime\b|\bbeam\b|\bcab\b/i,
    ]],
    ["Transport - Public / Parking / Tolls", [
      /opal|myki|gocard|translink|transit|metro|bus\b|train\b|railway/i,
      /transport(?!.*fee)/i,
      /parking|toll/i,
      /nnn\s?international|interchange\s?7/i,
    ]],
    ["Transport - Public / Parking / Tolls", [
      /fuel|gas\s?station|petrol|shell|chevron|bp\b|car\s?wash|auto\s?repair|mechanic|tire/i,
      /airport/i,
    ]],
  ],
  "Subscriptions": [
    ["Books / Digital Content", [
      /2c2p/i,
      /dg\*?rom/i,
      /\bbooks?\b|textbook|kindle|audible/i,
    ]],
    ["Health & Fitness", [
      /whoop/i,
    ]],
    ["Education / Professional Dev", [
      /dri\*?gallup/i,
      /\budemy\b/i,
    ]],
    ["Telecom", [
      /skneteuueokseu/i,
    ]],
    ["Subscription / Membership", [
      // Everything else in Subscriptions
      /.+/i,
    ]],
  ],
  "Bills & Utilities": [
    ["International Transaction Fee", [
      /international\s?transaction\s?fee/i,
      /overseas\s*(?:transaction\s*)?fee/i,
    ]],
    ["Bank Fees", [
      /account\s?fee/i,
      /\bsweep\b/i,
      /(?:annual|monthly|late|service)\s*fee|surcharge/i,
      /annual\s?charge/i,
      /shopback/i,
    ]],
    ["Utilities \u2013 Electricity", [
      /origin\s?energy/i,
      /electric|power|energy/i,
    ]],
    ["Utilities \u2013 Water", [
      /sydney\s?water|hunter\s?water|sa\s?water/i,
      /water\s?bill/i,
    ]],
    ["Telecom \u2013 Internet", [
      /tangerine/i,
      /nbn\b|iinet|tpg\b/i,
      /broadband/i,
    ]],
    ["Telecom \u2013 Phone", [
      /vodafone/i,
    ]],
    ["Telecom \u2013 Phone / Internet", [
      /optus|telstra/i,
      /phone\s?bill|mobile\s?plan|internet|wifi|cable/i,
      /telecom|billing/i,
    ]],
    ["Government / Registration", [
      /service\s?nsw/i,
      /\bcouncil\b/i,
      /municipal|city\s?of/i,
    ]],
    ["Professional Services \u2013 Tax", [
      /tax7|accountant/i,
      /h\s?and\s?r\s?block/i,
    ]],
    ["Shipping / Postage", [
      /au\s?post|\bpost\s?chatswood/i,
    ]],
    ["Home \u2013 Storage", [
      /eziabacus|storage\s?oper/i,
    ]],
    ["Professional Services", [
      /\bvisa\b/i,
      /\bmigration\b/i,
      /\bconsult/i,
    ]],
    ["Utilities", [
      /utilit(?:y|ies)|garbage|sewage|gas\s?bill/i,
    ]],
  ],
  "Housing": [
    ["Rent / Bond", [
      /rent(?:al)?\b|mortgage|lease|bond/i,
      /stratapay|strata\s?pay/i,
      /property|condo|apartment|housing|hoa\b|home\s?insurance|real\s?estate/i,
    ]],
    ["Furniture & Bedding", [
      /eva\s?mattress|sp\s?eva/i,
      /origin\s?sleep/i,
      /mattress|bedding|furniture/i,
    ]],
  ],
  "Entertainment": [
    ["Attractions / Tickets", [
      /scenic\s?world/i,
      /\btaronga\b/i,
      /sea\s?life/i,
      /moonlit\s?sanctuary/i,
      /hunter\s?valley\s?garden/i,
      /blue\s?mountains?\s?city/i,
      /echo\s?point/i,
      /parks?\s?cradle/i,
      /nxt.*easter/i,
      /currumbin/i,
      /ripleys?|ripley/i,
      /dreamworld/i,
      /phillip\s?island/i,
      /port\s?arthur/i,
      /amusement|zoo|museum/i,
      /lee\s?byung\s?hun/i,
      /puffing\s?billy/i,
      /\bvrtp\b/i,
    ]],
    ["Sports & Recreation", [
      /top\s?serve\s?tennis/i,
      /ezi\*?lane\s?cove\s?golf/i,
      /\btennis\b|\bgolf\b|\bswim(?:ming)?\b/i,
    ]],
    ["Entertainment", [
      // Everything else in Entertainment (cinema, gaming, bars, etc.)
      /.+/i,
    ]],
  ],
  "Education": [
    ["Books / Digital Content", [
      /\bbooks?\b|textbook/i,
    ]],
    ["Subscription / Membership", [
      /.+/i,
    ]],
  ],
  "Charity": [
    ["Donations", [
      /.+/i,
    ]],
  ],
  "Personal Care": [
    ["Beauty / Skincare / Cosmetics", [
      /.+/i,
    ]],
  ],
  "Transfer": [
    ["Credit Card Repayment", [
      /\bamex\b|american\s?express/i,
      /hsbc/i,
      /\bbpay\b/i,
      /card\s?(?:repayment|payment)/i,
      /autopay/i,
    ]],
    ["Internal Transfer", [
      /savings|goal\s?saver/i,
      /netbank/i,
      /own\s?account/i,
      /\bsaving\b/i,
      /transfer\s+(?:to|from)\s+xx\d/i,
      /\btest\b/i,
    ]],
    ["Transfers", [
      /transfer|zelle|venmo|paypal|wire|remittance|sent\s?to|received\s?from|p2p/i,
      /osko|payid|pay\s?id/i,
      /investment\s?group|acf\s?investment/i,
    ]],
  ],
  "Other": [
    ["Cash Withdrawal", [
      /\batm\b/i,
    ]],
    ["Laundry", [
      /coin\s?laund|laundry/i,
    ]],
    ["Unknown / Review", [
      /.+/i,
    ]],
  ],
};

export function subcategorizeTransaction(description: string, mainCategory: string, amount?: number): string | undefined {
  const cleaned = description.trim();

  // Optus roaming detection: $5/day charges → Telecom – Roaming
  if (mainCategory === "Bills & Utilities" && /optus/i.test(cleaned) && amount !== undefined && Math.abs(amount) === 5) {
    return "Telecom \u2013 Roaming";
  }

  const rules = SUBCATEGORY_RULES[mainCategory];
  if (!rules) return undefined;
  for (const [subcategory, patterns] of rules) {
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        return subcategory;
      }
    }
  }
  return undefined;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Travel": "#0ea5e9",
  "Food & Dining": "#ef4444",
  "Groceries": "#f97316",
  "Transport": "#eab308",
  "Shopping": "#84cc16",
  "Bills & Utilities": "#22c55e",
  "Subscriptions": "#14b8a6",
  "Housing": "#06b6d4",
  "Health": "#3b82f6",
  "Entertainment": "#6366f1",
  "Education": "#8b5cf6",
  "Transfer": "#a855f7",
  "Income": "#10b981",
  "Refund": "#34d399",
  "Reimbursement": "#2dd4bf",
  "Insurance": "#d946ef",
  "Personal Care": "#ec4899",
  "Pets": "#f43f5e",
  "Charity": "#f59e0b",
  "Other": "#6b7280",
};
