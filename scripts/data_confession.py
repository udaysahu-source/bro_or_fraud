def get_confession_packs(loc, base):
    def cr_item(item_id, tags, prompt_h, prompt_e, ghosts, level="spicy"):
        return dict(
            base(item_id, tags, level),
            prompt=loc(prompt_h, prompt_e),
            ghostAnswers=[loc(gh, ge) for gh, ge in ghosts]
        )

    # 30 items for fake flexes
    ff = [
        cr_item("cr-ff-001", ["career", "bluff"],
            "LinkedIn pe aisi konsi cheez claim kar sakte ho jiska 0% proof hai?",
            "What's the most impressive thing you could claim on LinkedIn with absolutely no evidence?",
            [
                ("Managed cross-functional stakeholder alignments", "Managed cross-functional stakeholder alignments"),
                ("Directly advised high-growth seed stage startups", "Directly advised high-growth seed stage startups"),
                ("Architected scalable cloud microservices in hackathons", "Architected scalable cloud microservices in hackathons"),
                ("Self-taught algorithmic trader with 95% winrate", "Self-taught algorithmic trader with 95% winrate")
            ]
        ),
        cr_item("cr-ff-002", ["startup", "bluff"],
            "Ek aisa startup idea batao jo investor ko sunne mein mast lage par ek question mein phat jaye?",
            "Invent a startup idea that sounds fundable until someone asks one follow-up question.",
            [
                ("Uber for hostel laundry but driven by drones", "Uber for hostel laundry but driven by drones"),
                ("AI that predicts which assignment will be checked", "AI that predicts which assignment will be checked"),
                ("Decentralized blockchain chai tapri coupon exchange", "Decentralized blockchain chai tapri coupon exchange"),
                ("Smart socks that alert you before roommate enters", "Smart socks that alert you before roommate enters")
            ]
        ),
        cr_item("cr-ff-003", ["internet", "bluff"],
            "10 minute ka YouTube tutorial dekh ke kaunsi skill resume pe daali ja sakti hai?",
            "What's a skill you could confidently claim after watching one tutorial?",
            [
                ("Prompt Engineering Specialist", "Prompt Engineering Specialist"),
                ("Cybersecurity & Penetration Testing Basics", "Cybersecurity & Penetration Testing Basics"),
                ("DevOps Kubernetes Infrastructure Lead", "DevOps Kubernetes Infrastructure Lead"),
                ("Figma UI/UX Design System Architect", "Figma UI/UX Design System Architect")
            ]
        ),
        cr_item("cr-ff-004", ["social-media", "humour"],
            "Bare minimum kaam karke sabse bada humblebrag kya likh sakte ho?",
            "Write a humblebrag about doing the bare minimum.",
            [
                ("Humbled to have attended 5 straight classes this week", "Humbled to have attended 5 straight classes this week"),
                ("Thrilled to announce I submitted my form before 11:59 PM", "Thrilled to announce I submitted my form before 11:59 PM"),
                ("Grateful for the opportunity to survive another Monday viva", "Grateful for the opportunity to survive another Monday viva"),
                ("Excited to share I finally cleared all pending WhatsApp pings", "Excited to share I finally cleared all pending WhatsApp pings")
            ]
        ),
        cr_item("cr-ff-005", ["humour", "bluff"],
            "Group meeting miss karne ka sabse specific fake excuse?",
            "What's the most suspiciously specific excuse for missing a meeting?",
            [
                ("Mere roommate ki billi ka online viva chal raha tha", "My roommate's cat had an online viva"),
                ("Wi-Fi router mein achanak lizard phas gayi thi", "A lizard got trapped in our Wi-Fi router"),
                ("Room lock ka handle tut gaya aur key andar reh gayi", "Door handle jammed and key was stuck inside"),
                ("Laptop ka motherboard update ke beech freeze ho gaya", "Motherboard firmware froze mid-update")
            ]
        ),
        cr_item("cr-ff-006", ["productivity"],
            "Ek aisa productivity hack jo bas fancy bahaana hai procrastination ka?",
            "Invent a productivity method that is just procrastination with better branding.",
            [
                ("Notion color-coded kanban boards decorate karna", "Color coding Notion database views"),
                ("Study playlist ke liye 2 ghante lofi songs filter karna", "Curating 400 lofi tracks for focus"),
                ("Subah 5 AM productivity routine ka wallpaper design karna", "Designing 5 AM routine wallpapers"),
                ("Productivity timer app ka premium lifetime subscription research karna", "Researching lifetime pomodoro apps")
            ]
        ),
        cr_item("cr-ff-007", ["career", "social-media"],
            "LinkedIn pe 500 likes paane wala sabse fake achievement post?",
            "Write a fake achievement that would get 500 LinkedIn likes.",
            [
                ("What waking up at 4 AM taught me about B2B SaaS growth", "What waking up at 4 AM taught me about B2B SaaS"),
                ("Why I rejected a 50 LPA offer to follow my true passion", "Why I rejected 50 LPA to find my true self"),
                ("I failed 100 interviews and that became my biggest superpower", "How failing 100 interviews built my resilience"),
                ("Today I helped an intern fix a typo and cried tears of pride", "Helped an intern fix a typo and wept with joy")
            ]
        ),
        cr_item("cr-ff-008", ["creator", "humour"],
            "47 incomplete side projects hone ka sabse believable justification?",
            "What's the most believable reason someone has 47 unfinished side projects?",
            [
                ("I am a rapid prototyper, not a maintainer", "I am a rapid prototyper, not a maintainer"),
                ("Tech stack evolve ho gaya isliye v2 plan kar raha hu", "Tech stack evolved before I finished MVP"),
                ("Waiting for AI agents to write the remaining 80%", "Waiting for autonomous agents to complete it"),
                ("Market timing wasn't optimal for the consumer", "Market timing was not optimal yet")
            ]
        ),
        cr_item("cr-ff-009", ["internet", "bluff"],
            "Course ka aisa naam jo fancy lage par sikhaye bas ek basic formula?",
            "Invent a course title that sounds premium but teaches one obvious thing.",
            [
                ("Masterclass in High-Impact Algorithmic Data Structures", "Masterclass in High-Impact Data Structures"),
                ("Executive Diploma in Strategic Communication & Synergy", "Executive Diploma in Strategic Synergy"),
                ("Quantum Wealth Acceleration Framework 2026", "Quantum Wealth Acceleration Framework 2026"),
                ("Deep Neural Optimization for Creative Leaders", "Deep Neural Optimization for Creative Leaders")
            ]
        ),
        cr_item("cr-ff-010", ["career", "humour"],
            "Log kis cheap harkat ko 'strategic networking' bolte hain?",
            "What's the most ridiculous thing a person could call 'strategic networking'?",
            [
                ("Alumni ke har post pe 'Agree' comment karna", "Commenting 'Agree' on every alumni post"),
                ("Fest guest speaker ko car tak escort karna", "Escorting fest guest speaker to their cab"),
                ("College director ko Facebook pe friend request bhejna", "Sending Facebook request to college director"),
                ("Placement cell coordinator ko canteen mein chai pilana", "Buying cutting chai for placement cell seniors")
            ]
        ),
        cr_item("cr-ff-011", ["career"],
            "Resume mein hobbies section ka sabse fake entry?",
            "What's the most fabricated entry in a resume hobbies section?",
            [
                ("Reading autobiographies of world leaders", "Reading autobiographies of world leaders"),
                ("Analyzing global economic geopolitics", "Analyzing global economic geopolitics"),
                ("Volunteering for animal rehabilitation trusts", "Volunteering for animal rehabilitation trusts"),
                ("Listening to classical instrumental symphonies", "Listening to classical instrumental symphonies")
            ]
        ),
        cr_item("cr-ff-012", ["college"],
            "Final year project presentation mein sabse bada white lie?",
            "The biggest white lie told during final year project demo?",
            [
                ("Accuracy rate is 99.4% on real-world datasets", "Accuracy rate is 99.4% on real-world datasets"),
                ("We tested this on 10,000 active concurrent users", "Tested on 10,000 active concurrent users"),
                ("The cloud backend auto-scales seamlessly", "The cloud backend auto-scales seamlessly"),
                ("All data privacy regulations are strictly adhered to", "All privacy regulations strictly adhered to")
            ]
        ),
        cr_item("cr-ff-013", ["social"],
            "Fake busy banne ke liye phone pe log kya natak karte hain?",
            "What fake act do people pull on their phone to look important?",
            [
                ("Calculator open karke intensely numbers type karna", "Typing furious calculations on the calculator"),
                ("Settings app mein random menu toggle karna", "Opening and closing Settings submenus"),
                ("Ek purana PDF khol ke serious face banana", "Scrolling a 200-page terms of service PDF"),
                ("AirPods lagaye bina kisi se fake call pe ladna", "Faking a high-stakes call with no one connected")
            ]
        ),
        cr_item("cr-ff-014", ["tech"],
            "GitHub green streak maintain karne ka sabse sasta jugad?",
            "Cheapest trick to fake a GitHub contribution streak?",
            [
                ("Roz README mein ek space add karke push karna", "Adding one space to README.md daily"),
                ("Bot script se auto-commit loop chalana", "Running a cron job that commits timestamp daily"),
                ("Dost ke repo ko fork karke dummy pull request", "Forking friends and opening dummy PRs"),
                ("Personal notes ko private repo mein push karna", "Pushing grocery lists as markdown commits")
            ]
        ),
        cr_item("cr-ff-015", ["startup"],
            "Founder banne ka sabse pehla flex jo product se pehle aata hai?",
            "First founder flex people show off before writing a single line of code?",
            [
                ("Twitter handle pe 'Building in public 🚀' lagana", "Adding 'Building in public 🚀' to Twitter bio"),
                ("Notion company wiki mein 50 blank docs create karna", "Creating 50 blank notion company pages"),
                ("Domain khareed ke customized corporate email banana", "Buying custom domain for corporate email"),
                ("Swag t-shirt aur hoodie ka mock print dekhna", "Designing company branded hoodies")
            ]
        ),
        cr_item("cr-ff-016", ["money"],
            "Stock market trading ka fake profit flex kaisa hota hai?",
            "How do people fake stock market trading mastery?",
            [
                ("Paper trading app ka screenshot crop karke lagana", "Cropping paper trading demo accounts"),
                ("Sirf 40 rupaye ke profit pe green bar post karna", "Posting a 40 rupee green bar screenshot"),
                ("Candlestick charts pe 15 trendline draw karna", "Drawing 15 random trendlines on TradingView"),
                ("Warren Buffett quotes with dark moody background", "Posting Warren Buffett quotes with moody visuals")
            ]
        ),
        cr_item("cr-ff-017", ["college"],
            "Hackathon team leader hone ka sabse bada showoff?",
            "The biggest showoff act of a hackathon team captain?",
            [
                ("Presentation stage pe black t-shirt pehen ke microphone pakadna", "Wearing a black polo with stage mic"),
                ("Teammates ko 'Let him cook' bolke mic forward karna", "Handing off mic saying 'Now my tech lead explains'"),
                ("Git conflicts pe exasperated sigh nikalna", "Sighing deeply whenever git conflict occurs"),
                ("Mentors ke sath handshake ki selfie post karna", "Selfie shaking hands with hackathon mentors")
            ]
        ),
        cr_item("cr-ff-018", ["social-media"],
            "Instagram bio mein likha sabse delulu title?",
            "Most delusional credential in an Instagram bio?",
            [
                ("Digital Nomad | Globetrotter | Philanthropist", "Digital Nomad | Globetrotter | Philanthropist"),
                ("Living life on my own terms 🌟", "Living life on my own terms 🌟"),
                ("Curator of positive vibrations and coffee", "Curator of positive vibrations and coffee"),
                ("Official brand ambassador for fitness lifestyle", "Official brand ambassador for fitness lifestyle")
            ]
        ),
        cr_item("cr-ff-019", ["lifestyle"],
            "Health conscious dikhne ke liye log kya dikhava karte hain?",
            "Fake flex people pull to appear aggressively healthy?",
            [
                ("Green tea bag ko cup mein 4 ghante dubana", "Dipping green tea bag for 4 hours straight"),
                ("Table pe chia seeds ka jar sajake rakhna", "Keeping chia seeds jar on desk as decoration"),
                ("Water intake tracking app se notification boast karna", "Boasting 3 liters water intake notifications"),
                ("Canteen mein salad maangna jahan sirf samosa milta hai", "Asking for fresh avocado in a tier-3 canteen")
            ]
        ),
        cr_item("cr-ff-020", ["career"],
            "Internship offer letter aane ke baad sabse pehla dramatic move?",
            "Most theatrical move after receiving an internship offer letter?",
            [
                ("LinkedIn headline change before signing contract", "Updating headline before even signing contract"),
                ("Story pe 'New Chapter Begins' with blurred company logo", "Posting blurred company logo with cryptic caption"),
                ("Family WhatsApp group mein 2 page ka emotional essay", "Two-page emotional thank you speech on family group"),
                ("Hostel dosto ko achanak professional advice dena", "Giving unsolicited career advice to roommate")
            ]
        ),
        cr_item("cr-ff-021", ["social"],
            "Party mein mysterious dikhne ka sasta tareeqa?",
            "Cheap trick used to appear mysteriously attractive at a party?",
            [
                ("Corner mein khade hoke silent phone dekhna", "Standing in corner silently checking phone"),
                ("Bas smile karke 'It's complicated' bolna", "Smiling subtly and saying 'It's complicated'"),
                ("French film references throw karna", "Casually dropping foreign cinema references"),
                ("Dark corner chair pe drink swirl karna", "Slowly swirling mocktail in dim lighting")
            ]
        ),
        cr_item("cr-ff-022", ["tech"],
            "Coder bros ka sabse bada mechanical keyboard flex?",
            "Biggest flex coder bros display about their mechanical keyboards?",
            [
                ("Library mein deliberate blue switches loud press karna", "Clicking loud blue switches in quiet study rooms"),
                ("Custom coiled cable and artisan resin keycaps", "Custom coiled pastel cables and resin caps"),
                ("Typing test speed ka screenshot bio mein lagana", "Typing speed test result screenshot on display"),
                ("Har keypress pe deep clack audio enjoy karna", "Recording ASMR typing audio for reels")
            ]
        ),
        cr_item("cr-ff-023", ["academics"],
            "Library mein desk reserve karne ka sabse rude hack?",
            "Rude move used to hoard library tables for days?",
            [
                ("Ek purana register aur pen chhod ke chale jana", "Leaving an empty register and broken pen for days"),
                ("Chair pe hoodie tang ke 6 ghante gayab rehna", "Draping jacket on chair and vanishing for 6 hours"),
                ("Table pe 'Reserved for Research Scholar' slip lagana", "Faking a research scholar reservation slip"),
                ("Paani ki bottle aur charger plug in chhodna", "Leaving disconnected charger occupying socket")
            ]
        ),
        cr_item("cr-ff-024", ["dating"],
            "First date pe cool sound karne ka sabse bada disaster claim?",
            "Disaster claim made on a first date to sound cultured?",
            [
                ("I don't really watch mainstream cinema, only indie documentaries", "I only consume non-mainstream indie cinema"),
                ("I am writing a psychological novel on solitude", "I am writing a psychological novel on solitude"),
                ("I don't use social media at all (has 5000 followers)", "I don't use social media (has 5000 followers)"),
                ("I view wealth as a spiritual illusion", "I view money as a spiritual illusion")
            ]
        ),
        cr_item("cr-ff-025", ["college"],
            "CR (Class Representative) banne ka sabse bada fake motivation?",
            "Fake reason people give for running for Class Representative?",
            [
                ("I want to selflessly serve my student community", "I want to selflessly serve my student community"),
                ("I want to bridge communication gap with faculty", "Bridge the communication gap with faculty"),
                ("Building democratic harmony across our department", "Fostering democratic student harmony"),
                ("Ensuring every voice is heard equally", "Ensuring every single voice is represented")
            ]
        ),
        cr_item("cr-ff-026", ["work"],
            "Freelance gig milte hi log kya bio update karte hain?",
            "Bio update made right after scoring a $5 freelance gig?",
            [
                ("Managing Partner at Global Digital Agency", "Managing Partner at Global Digital Agency"),
                ("International Client Consultant & Strategist", "International Client Consultant & Strategist"),
                ("Cross-border remote solutions executive", "Cross-border remote solutions executive"),
                ("Freelance enterprise consultant", "Freelance enterprise consultant")
            ]
        ),
        cr_item("cr-ff-027", ["fitness"],
            "Fitness journey ke pehle din Instagram reel ka caption?",
            "Caption of day-1 fitness journey reel?",
            [
                ("Day 1 of becoming unrecognizable 😤", "Day 1 of becoming unrecognizable 😤"),
                ("They doubted me, now watch me transform", "They doubted me, now watch the comeback"),
                ("Pain is temporary, legacy is forever #Grind", "Pain is temporary, legacy is forever"),
                ("Silently working on myself, results will roar", "Silently working, results will make the noise")
            ]
        ),
        cr_item("cr-ff-028", ["slang"],
            "Gen-Z corporate talk ka sabse fake usage?",
            "Most forced usage of corporate jargon by a student?",
            [
                ("Let's take this discussion offline to canteen tapri", "Let's take this offline to the canteen"),
                ("I don't have the mental bandwidth for this assignment", "I lack the mental bandwidth for this lab"),
                ("We need to synergize our deliverables by tonight", "Synergize our deliverables by tonight"),
                ("Circling back on the Maggi bill from yesterday", "Circling back on yesterday's Maggi bill")
            ]
        ),
        cr_item("cr-ff-029", ["academics"],
            "Exam ke baad 'Mera to paper bohot kharab gaya' bolne wale ka twist?",
            "Classic move of the guy who says 'My exam went terrible'?",
            [
                ("Scores 98 out of 100 with class rank 1", "Scores 98/100 and tops the entire university"),
                ("Says he left 30 marks blank but wrote 45 pages", "Claims left questions blank but used 45 pages"),
                ("Cries until topper sheet is pinned on notice board", "Weeps until highest marks notice is pinned"),
                ("Blames handwriting for scoring an A grade", "Blames poor handwriting for getting an A+")
            ]
        ),
        cr_item("cr-ff-030", ["social"],
            "Story views check karne ke baad khud ko satisfy karne ka dialogue?",
            "Mental copium after checking story viewers for the 50th time?",
            [
                ("Unka internet band hoga isliye nahi dekha", "Their Wi-Fi must be off, that's why no view"),
                ("Algorithm unko meri story jaan boojh ke nahi dikha raha", "Algorithm is deliberately suppressing my story"),
                ("Dekh ke ignore kiya hoga, obsessed hain mere se", "They saw and ignored because they are intimidated"),
                ("Koi na, Close Friends list clean up karne ka time aa gaya", "Time to clean up my Close Friends list anyway")
            ]
        )
    ]

    # 30 items for digital confessions
    dc = [
        cr_item("cr-dc-001", ["internet", "confession"],
            "Screen time report khulne par konsi aisi aadat hai jo tum deny kar doge?",
            "What's a harmless online habit you would deny if someone opened your screen-time report?",
            [
                ("Ex ke naye partner ke cousins ko stalk karna", "Stalking an ex's new partner's extended family"),
                ("Zomato pe khana add karke 45 min bas menu ghoorna", "Browsing Zomato menus for 45 minutes with no intent"),
                ("Google Maps pe random rich colonies ka street view dekhna", "Browsing multimillion-dollar houses on Maps"),
                ("Wikipedia pe celebrities ki net worth aur controversies padhna", "Reading niche celebrity drama on Wikipedia")
            ]
        ),
        cr_item("cr-dc-002", ["social-media"],
            "Online unbothered dikhne ke liye sabse zyada effort kab lagaya hai?",
            "What's the most effort you've put into looking unbothered online?",
            [
                ("Story upload karke phone ko 3 ghante flight mode pe daala", "Put phone on airplane mode for 3 hours after posting"),
                ("Reply type karke 4 ghante baad deliberately send kiya", "Drafted reply instantly, waited 4 hours to send"),
                ("Close Friends se usko nikala phir wapas add kiya", "Removed someone from Close Friends then re-added"),
                ("Online the par kisi ka status deliberately view nahi kiya", "Stayed active online while intentionally avoiding status")
            ]
        ),
        cr_item("cr-dc-003", ["social-media"],
            "Dimaag mein draft kiya hua aisa post jo kabhi upload nahi kar paoge?",
            "What's a post you've drafted in your head but would never publish?",
            [
                ("College ke toxic group project members ka savage roast", "Brutal callout of lazy group project members"),
                ("Humourous breakdown of why my attendance is 12%", "Humorous breakdown of why my attendance is 12%"),
                ("Open letter to the hostel mess committee with evidence", "Open letter to the mess committee with photo proofs"),
                ("Detailed analysis of why my batchmates are LinkedIn NPCs", "Exposé on why all my batchmates are LinkedIn NPCs")
            ]
        ),
        cr_item("cr-dc-004", ["internet"],
            "Kisi ki social profile ko judge karne ka sabse chota aur unserious reason?",
            "What's the most unserious reason you've judged someone's profile?",
            [
                ("Bio mein 'Live Laugh Love' likha hua tha", "They used 'Live Laugh Love' unironically"),
                ("Cursive font mein apna naam likha tha bio mein", "Used cursive italic unicode font for their username"),
                ("Story pe time aur temperature ka sticker lagaya tha", "Posted weather and temperature stickers on stories"),
                ("Highlights ka cover color-coded icons pe tha", "Had over-designed cartoon covers on story highlights")
            ]
        ),
        cr_item("cr-dc-005", ["trends"],
            "Aisa trend jiska matlab bina samjhe dosto ke samne cool banne ke liye use kiya?",
            "What's a trend you pretended to understand before actually understanding it?",
            [
                ("Mewing and jawline exercises", "Mewing and jawline exercises"),
                ("Skibidi toilet lore among younger cousins", "Skibidi toilet lore among younger cousins"),
                ("Brat summer aesthetic vibe", "Brat summer aesthetic vibe"),
                ("Web3 and smart contracts in 2021", "Web3 decentralized smart contracts")
            ]
        ),
        cr_item("cr-dc-006", ["internet"],
            "Ek single notification ki wajah se sabse bada over-analysis kab kiya tha?",
            "What's a harmless thing you have over-analysed because of one notification?",
            [
                ("Unhone story like kiya to socha shadi ka plan hai", "They liked my story so I planned our wedding"),
                ("LinkedIn notification 'Someone viewed your profile'", "Built conspiracy theories from 'Someone viewed your profile'"),
                ("WhatsApp pe 'typing...' dikha aur phir gayab ho gaya", "Saw 'typing...' for 3 seconds then it disappeared"),
                ("Group chat mein sabne mere joke pe bas react kiya", "Everyone just reacted with an emoji instead of laughing")
            ]
        ),
        cr_item("cr-dc-007", ["internet"],
            "Search history mein aisi konsi cheez hai jiska galat matlab nikala ja sakta hai?",
            "What's the funniest thing your search history could be misunderstood as?",
            [
                ("How to fake severe fever for internal test", "How to fake severe fever for internal test"),
                ("Can hostel kettle explode if boiled empty", "Can electric kettle explode if boiled empty"),
                ("Is 42% attendance legal ground for semester debar", "Is 42% attendance legal ground for debarment"),
                ("How to survive on Maggi and water for 6 days", "How to survive on noodles and water for 6 days")
            ]
        ),
        cr_item("cr-dc-008", ["confession"],
            "Cheez jo public mein cringe bolte ho par secretly bohot enjoy karte ho?",
            "What's something you act too cool to enjoy but secretly like?",
            [
                ("Cringe Bollywood item songs on full volume", "Cringe nostalgic 2000s Bollywood dance songs"),
                ("Indian soap opera dramatic plot twists on reels", "Dramatic soap opera mother-in-law twists on reels"),
                ("Horoscope and zodiac compatibility posts", "Daily horoscope and zodiac compatibility checks"),
                ("Reaction videos of foreigners listening to Indian music", "Foreigners reacting to Indian songs for validation")
            ]
        ),
        cr_item("cr-dc-009", ["social"],
            "Call avoid karne ke liye banaya hua sabse elaborate jhooth?",
            "What's the most elaborate excuse you've made to avoid a call?",
            [
                ("Sirf voice note bheja 'Network itna kharab hai aawaz nahi aayegi'", "Voice note claiming network is too weak for voice call"),
                ("Phone ko flight mode pe daal ke screenshot save kiya", "Took screenshot of airplane mode to prove no connectivity"),
                ("Bol diya mummy ne phone cheen liya hai padhai ke liye", "Said parents confiscated phone for exam season"),
                ("Bahaana banaya ki phone charger kharab ho gaya hai", "Pretended charging cable burned and phone is at 2%")
            ]
        ),
        cr_item("cr-dc-010", ["confession"],
            "Ek aisi choti cheez jisko tumne nuclear secret ki tarah treat kiya?",
            "What's a completely harmless thing you have treated like classified information?",
            [
                ("Canteen mein kiski treat mili thi", "Who sponsored the evening canteen treat"),
                ("Internal test ke practical batch ka time slot", "Practical exam batch time slot"),
                ("Apna Spotify On Repeat playlist", "My guilty-pleasure Spotify On Repeat playlist"),
                ("College ke library fine ki exact amount", "The exact amount of my overdue library fines")
            ]
        ),
        cr_item("cr-dc-011", ["internet"],
            "Late night online shopping ka sabse shameful cart order?",
            "Most shameful 3 AM online impulse purchase or cart?",
            [
                ("100 glow-in-the-dark stars for bedroom ceiling", "100 glow-in-the-dark ceiling stickers"),
                ("Aesthetic posture corrector belt from Instagram ad", "Instagram ad posture corrector belt"),
                ("Automatic egg boiler for hostel room", "Single egg electric mini boiler"),
                ("Expensive imported Korean noodles that tasted like soap", "Imported ramen pack that burned my tongue")
            ]
        ),
        cr_item("cr-dc-012", ["social-media"],
            "Instagram story post karke kitne seconds mein delete kiya hai aur kyu?",
            "Fastest time you deleted an Instagram story after posting and why?",
            [
                ("12 second mein delete kiya kyunki ek typo tha", "12 seconds because of a typo in the title"),
                ("Wrong person viewed within 5 seconds", "The target person viewed it too fast, got scared"),
                ("Caption sound kiya bohot needy", "The caption sounded too desperate on second read"),
                ("Photo quality upload ke baad blur ho gayi thi", "Compression ruined the image quality completely")
            ]
        ),
        cr_item("cr-dc-013", ["internet"],
            "Online argument mein jeetne ke liye research ka sabse extreme level?",
            "Most unhinged effort to win a pointless internet argument?",
            [
                ("2014 ke Facebook post ka screenshot dhoond ke nikala", "Dug up a 2014 Facebook screenshot for proof"),
                ("Wikipedia edit check karne ke liye revision history padhi", "Audited Wikipedia edit timestamps for evidence"),
                ("Reddit thread ke 800 comments scroll kiye", "Scrolled 800 Reddit comments to find one source"),
                ("Google scholar pe research paper search kiya to prove a meme wrong", "Searched Google Scholar to debunk a casual meme")
            ]
        ),
        cr_item("cr-dc-014", ["dating"],
            "Crush ke baare mein online pata ki gayi sabse deeply specific cheez?",
            "Most specific obscure detail discovered while stalking a crush?",
            [
                ("Unke school annual day 2016 ka dance video", "Their 2016 middle school annual day skit video"),
                ("Unke pet dog ka birthday date aur breed", "Their pet dog's precise birthday and origin story"),
                ("Unka high school favorite cartoon character", "Their favorite anime from a dead Tumblr account"),
                ("Unke distant relative ki wedding album album", "Their distant cousin's complete wedding album")
            ]
        ),
        cr_item("cr-dc-015", ["lifestyle"],
            "Phone pe digital hoarding ka sabse embarrassing proof?",
            "Worst evidence of digital hoarding on your phone?",
            [
                ("14,000 unread promotional emails", "14,000 unread spam emails dating back to 2019"),
                ("1,800 saved reels jo kabhi dubara nahi dekhe", "1,800 saved reels categorized into dead folders"),
                ("5,000 screenshots of memes and payment receipts", "5,000 screenshots of receipts and random memes"),
                ("120 open browser tabs on mobile Safari/Chrome", "120 open tabs in mobile browser since last month")
            ]
        ),
        cr_item("cr-dc-016", ["tech"],
            "Free trial khatam hone se bachne ke liye banaye fake accounts?",
            "Most desperate trick to abuse a 7-day free trial?",
            [
                ("8 alag Google accounts banaye bas Canva pro ke liye", "Created 8 Gmail aliases just for Canva free trials"),
                ("Temp-mail generator use karke resume download kiya", "Used burner email generators to download resume PDFs"),
                ("Ghar ke sabhi phones se Spotify family trial activate kiya", "Used every family member's phone for music trials"),
                ("Credit card pe limit 1 rupee set karke trial lia", "Set card spending limit to 1 INR so renewal fails")
            ]
        ),
        cr_item("cr-dc-017", ["social"],
            "Audio message sunne ke liye speaker par lagane ka regret?",
            "Most awkward moment playing a WhatsApp voice note on speaker?",
            [
                ("Dost ne gaali bak di family dinner table pe", "Friend dropped loud slangs during family dinner"),
                ("Classroom mein silence ke beech ajeeb sound nikal aayi", "Obscene squeak echoed across a dead silent lecture"),
                ("Bus mein sabhi log mud ke dekhne lage", "Entire bus turned around and stared at my phone"),
                ("Voice note mein kisi professor ka funny mimic tha", "Mimicking a professor right when that professor walked by")
            ]
        ),
        cr_item("cr-dc-018", ["habits"],
            "Bathroom mein phone le jaake guzara hua sabse lamba waqt?",
            "Longest time spent sitting on the toilet just scrolling?",
            [
                ("Pair sunn ho gaye the khada nahi ho paya 45 min", "45 minutes until both legs went completely numb"),
                ("Hostel corridor mein 4 log darwaza peet rahe the", "4 angry wingmates banging on the door outside"),
                ("Pure YouTube documentary khatam kar li", "Watched a 40-minute history video in one sitting"),
                ("Screen pe steam jam gayi aur phone slip ho gaya", "Steam fogged up screen and phone slipped on floor")
            ]
        ),
        cr_item("cr-dc-019", ["college"],
            "Online exam ya quiz mein cheating ka sabse high-tech jugaad?",
            "Most unnecessarily complex cheating setup for an online test?",
            [
                ("TV ko secondary monitor banake curtain ke peeche lagaya", "Curtain hid a 42-inch TV acting as external monitor"),
                ("Friend WhatsApp group pe voice call connect karke mic mute kiya", "Open Discord audio room with phone placed under desk"),
                ("ChatGPT prompt voice dictation se solve karwaya", "Whispered prompts into wireless earbuds under long hair"),
                ("Screen mirror karke roommate se answers click karwaye", "Roommate operated mouse from behind the laptop screen")
            ]
        ),
        cr_item("cr-dc-020", ["social-media"],
            "Purani photo ya post dekh ke aane wala sabse bada cringe attack?",
            "The oldest memory on your social timeline that causes physical pain?",
            [
                ("2015 ki Facebook status 'Life is complicated with swag'", "2015 status: 'Life is complicated but swag is high'"),
                ("Filter wala selfie jismein contrast 1000% tha", "High-contrast selfie with bleached hair edit in 2016"),
                ("Lyrics copy karke breakup post banaya tha 8th class mein", "Dramatic emo breakup lyrics posted in 8th grade"),
                ("DP pe dark background with text 'Alone Walker'", "Profile picture captioned 'Silent Wolf Alone Walker'")
            ]
        ),
        cr_item("cr-dc-021", ["internet"],
            "Wikipedia rabbit hole mein kho jaane ka sabse random topic?",
            "Most obscure Wikipedia rabbit hole at 3 AM?",
            [
                ("List of unusual deaths in medieval Europe", "List of unusual deaths in medieval Europe"),
                ("History of the Indian postal pin-code system", "History of the Indian postal pin-code system"),
                ("Why aircraft carrier catapults use steam pressure", "Why aircraft carrier catapults use steam pressure"),
                ("Extinct flightless birds of New Zealand", "Extinct flightless birds of New Zealand")
            ]
        ),
        cr_item("cr-dc-022", ["money"],
            "Zomato ya Swiggy pe paise bachane ka sabse broke bahaana?",
            "Cheapest food delivery optimization trick?",
            [
                ("60 rupaye coupon ke liye 120 rupaye ka extra khana order kiya", "Spent 120 more on sides just to save 60 with a coupon"),
                ("Delivery partner se gate pe chori se milne gaya", "Sneaked to campus back gate so warden wouldn't seize food"),
                ("2 log milke 1 Biryani divide karke ladayi kiye", "Split a single biryani and fought over the piece"),
                ("Free delivery ke liye delivery boy banne ka socha", "Contemplated becoming a delivery boy for free snacks")
            ]
        ),
        cr_item("cr-dc-023", ["social"],
            "Birthday wish ko WhatsApp pe copy-paste karte waqt ka blunder?",
            "Worst copy-paste disaster while sending birthday wishes?",
            [
                ("Kisi aur ka naam message mein reh gaya", "Left someone else's name in the pasted paragraph"),
                ("Happy Birthday Bhai likh diya college professor ko", "Sent 'Happy bday bro have fun' to college HOD"),
                ("Dua aur shayari copy karke family group mein bhej diya", "Pasted romantic shayari to a wingmate by mistake"),
                ("Belated birthday wish bheja jab birthday agle mahine tha", "Sent belated birthday wishes a whole month early")
            ]
        ),
        cr_item("cr-dc-024", ["tech"],
            "Download folder ka sabse chaotic sach?",
            "The truth about what is in your Downloads folder right now?",
            [
                ("Untitled(1).pdf se Untitled(87).pdf tak ka graveyard", "A graveyard from Untitled(1).pdf to Untitled(87).pdf"),
                ("Unzipped assignments with names like 'final_final_v3_reallyfinal.zip'", "Zips named 'final_final_v3_reallyfinal.zip'"),
                ("Files from 2021 that I am afraid to delete", "Files from 2021 that I am too superstitious to delete"),
                ("Course certificates I never opened after downloading", "Course completion certificates downloaded and never opened")
            ]
        ),
        cr_item("cr-dc-025", ["dating"],
            "Dating app pe match milne ke baad sabse jaldi convo drop kab hui?",
            "Fastest time a dating app conversation died?",
            [
                ("'Hey' bolne ke baad unhone account delete kar diya", "Sent 'Hey' and they immediately deactivated account"),
                ("Pehle hi text pe apna resume forward kar diya", "Accidentally sent resume PDF instead of funny meme"),
                ("Mene horoscope match pucha aur unhone unmatch kiya", "Asked for their birth chart and they unmatched in 2 secs"),
                ("Aisi dry reply di ki conversation ki dehydration ho gayi", "Replied with 'k' and the chat fossilized instantly")
            ]
        ),
        cr_item("cr-dc-026", ["habits"],
            "Phone ki battery 1% pe hone par kitna extreme stretch kiya hai?",
            "Longest you stretched your phone battery at 1%?",
            [
                ("Brightness 0% karke 25 minute phone call chalaayi", "Brightness at 0%, managed a 25-minute emergency call"),
                ("Switch off hone se pehle fast OTP copy kiya", "Memorized banking OTP 0.5 seconds before phone died"),
                ("Phone ko warm karke 1% battery resurrect ki", "Rubbed phone battery against jeans to get 1 minute more"),
                ("Cab book karke driver ko drop location verbally explain kiya", "Booked cab at 1% and memorized car number plate")
            ]
        ),
        cr_item("cr-dc-027", ["social-media"],
            "Story viewers list mein kisko sabse upar dekhne ki wish hoti hai?",
            "Who do you secretly hope is at the top of your story viewers?",
            [
                ("The crush who hasn't replied to DMs in three weeks", "The crush who hasn't replied to DMs in three weeks"),
                ("The school rival who claimed I would achieve nothing", "The school rival who doubted my career journey"),
                ("Ex who said I had zero personality", "The ex who told me I was emotionally bland"),
                ("The college topper to prove I have a social life", "The college topper to prove I have an exciting life")
            ]
        ),
        cr_item("cr-dc-028", ["internet"],
            "Bina soche share kiye huye fake news pe regret?",
            "Most embarrassing fake news you believed and forwarded?",
            [
                ("UNESCO declared Indian national anthem best in galaxy", "UNESCO declared our national anthem best in galaxy"),
                ("NASA satellite photo showing India completely lit in Diwali", "NASA satellite showing glowing India during Diwali"),
                ("WhatsApp will turn blue and charge money from Monday", "WhatsApp turning blue and charging per message on Monday"),
                ("Eat boiled cloves to pass semester exams without studying", "Boiled clove water activates photographic memory")
            ]
        ),
        cr_item("cr-dc-029", ["lifestyle"],
            "Online class ke doran camera ke peeche ka dark truth?",
            "Darkest truth hidden behind your webcam during online college?",
            [
                ("Neeche pajama aur upar formal shirt pehni thi", "Formal ironed shirt on top, dirty boxer shorts below"),
                ("Camera ke samne photo laga ke bed pe so raha tha", "Static virtual background while sleeping soundly on bed"),
                ("Mic mute pe dost ke saath game khel raha tha", "Playing multiplayer shooter with mic muted on lectures"),
                ("Professor jab bolte the tab audio disconnect ka drama kiya", "Simulated robot static noises when asked a direct question")
            ]
        ),
        cr_item("cr-dc-030", ["social"],
            "Kisi dost ki post pe fake excitement ka level?",
            "Highest level of fake hype posted on a friend's average picture?",
            [
                ("'Bhai Hollywood level hero lag raha hai' on a blurry selfie", "Calling a blurry dimly-lit selfie 'Literal Hollywood material'"),
                ("50 flame emojis on an ordinary cup of tea", "Spamming 50 flame emojis on an ordinary lukewarm tea cup"),
                ("'Model status confirmed' on an unironic candid pose", "Writing 'Vogue cover scouted' on a passport photo"),
                ("Puri gang ke sath comment section spam karna", "Brigading the comment section with inside code words")
            ]
        )
    ]

    # 30 items for campus confessions
    camp = [
        cr_item("cr-cc-001", ["campus", "confession"],
            "College hostel mein ki hui sabse daring clandestine cooking?",
            "Most clandestine high-risk cooking in your hostel room?",
            [
                ("Iron box ulta karke uspe anda fry kiya", "Frying eggs on an inverted electric clothes iron"),
                ("Kettle mein Maggie banate waqt warden ne door knock kiya", "Warden knocked while butter aroma filled the corridor"),
                ("Heater coil se room breaker ud gaya aur sab andhere mein", "Blew the wing circuit breaker with a hidden immersion coil"),
                ("Roommate ke induction pe raat ke 3 baje popcorn banaya", "Popping kernels inside a saucepan with textbook as lid")
            ]
        ),
        cr_item("cr-cc-002", ["attendance"],
            "Proxy lagate waqt sabse bada heart attack moment?",
            "Most terrifying moment while calling a proxy attendance for a friend?",
            [
                ("Do baar 'Present Sir' boldiya ek hi roll number pe", "Accidentally yelled 'Present Sir' twice for the same roll number"),
                ("Professor ne mud ke pucha 'Tum dono ek hi shakal ke ho kya?'", "Professor turned and stared directly into my guilty eyes"),
                ("Dost jiske liye proxy lagayi wo absent hi nahi tha", "The friend walked into the classroom right after my proxy"),
                ("Professor ne biometric register se cross-check kar liya", "Professor immediately pulled out the biometric match sheet")
            ]
        ),
        cr_item("cr-cc-003", ["exams"],
            "Exam hall mein chits ya cheating ka sabse absurd kissa?",
            "Most absurd cheating strategy attempted in an internal exam?",
            [
                ("Calculator ke cover ke peeche microscopic formula likha", "Formulas etched microscopically inside calculator lid"),
                ("Water bottle ke label ke peeche answers print kiye", "Replaced transparent water bottle label with typed notes"),
                ("Eraser pe pencil se diagrams banaye the", "Detailed circuit diagrams carved into a rubber eraser"),
                ("Handkerchief mein code snippets likh ke handkerchief se naak saaf ki", "Wiped face with handkerchief covered in formulas")
            ]
        ),
        cr_item("cr-cc-004", ["hostel"],
            "Hostel curfew ke baad campus boundary jump karte waqt ka kissa?",
            "Story of escaping or entering campus over the boundary wall?",
            [
                ("Boundary wall pe pant phat gayi aur security guard dekh liya", "Tore my jeans on barbed wire while guard whistled"),
                ("Neeche kooda to warden ki cycle pe gira", "Landed directly on top of the night warden's bicycle"),
                ("Dost ne bola tha 'mai catch karunga' aur side hat gaya", "Friend promised to catch me and stepped aside instead"),
                ("Dog ne pecha kiya to hostel building tak sprint lagayi", "Chased by local stray dogs all the way to 3rd floor")
            ]
        ),
        cr_item("cr-cc-005", ["viva"],
            "External examiner ke samne viva mein bola gaya sabse safed jhooth?",
            "The boldest pure fiction spoken to an external viva examiner?",
            [
                ("Sir this code is written entirely in assembly for speed", "Sir this code is written in assembly for ultra efficiency"),
                ("Sir hardware kit short circuit ho gayi just 5 min pehle", "The prototype circuit burned out five minutes before viva"),
                ("I personally collected 500 field samples across town", "I personally traveled to 500 field locations for data"),
                ("The algorithm is proprietary and cannot be disclosed", "The intellectual algorithm is patented and confidential")
            ]
        ),
        cr_item("cr-cc-006", ["mess"],
            "Hostel mess se churayi hui sabse ajeeb cheez?",
            "Most bizarre item stolen from the hostel mess hall?",
            [
                ("Ek steel ka bada chamcha aur 4 katoriyan", "A massive steel ladle and four steel bowls for room"),
                ("Sunday special feast ke poore 6 gulab jamun", "Six gulab jamuns smuggled out inside empty tiffin"),
                ("Roti banane wala chimta room mein bread sekne ke liye", "Hot roti tongs to toast bread over electric kettle"),
                ("Salt shaker aur pickle jar poora ka poora", "The entire ceramic pickle jar from the condiments table")
            ]
        ),
        cr_item("cr-cc-007", ["assignment"],
            "Assignment copy karte waqt ki hui sabse stupid galti?",
            "Dumbest mistake made while copying an assignment word-for-word?",
            [
                ("Dost ki girlfriend ka naam margin mein copy kar diya", "Copied the girlfriend's doodle from the side margin"),
                ("Code mein variable name 'mera_dost_chutiya' submit kar diya", "Forgot to change offensive funny variable names in code"),
                ("Date purane saal ki likh di jo dost ne 2 saal pehle likhi thi", "Pasted 2021 date from senior's assignment in 2026"),
                ("Dost ka signature bhi replicate kar diya end page pe", "Accidentally replicated friend's signature on back page")
            ]
        ),
        cr_item("cr-cc-008", ["bunking"],
            "Mass bunk ke din akele class mein baithne wale ka sabse bada betrayal?",
            "The traitor who broke a mass bunk and attended alone?",
            [
                ("Usne bola tha mai bhi nahi aaunga aur pehli bench pe mila", "Swore on brotherhood to bunk, found on row 1 taking notes"),
                ("Professor ne us akele bande ko 10 bonus attendance di", "Professor awarded him 10 bonus attendance points"),
                ("Pure batch ke WhatsApp group se usko nikaal diya", "Unanimously kicked him out of the unofficial batch group"),
                ("Uski notebook class ke baad washroom mein chupa di", "Hid his fresh lecture notes inside the washroom ceiling")
            ]
        ),
        cr_item("cr-cc-009", ["roommate"],
            "Roommate ki peeth peeche uske baare mein ki hui sabse unhinged complain?",
            "Most outrageous complaint filed secretly against your roommate?",
            [
                ("He breathes too aggressively while watching gaming streams", "Breathes with violent intensity while watching streams"),
                ("Uses his socks as a mousepad on the shared table", "Uses dirty unwashed gym socks as an ergonomic mousepad"),
                ("Sets 15 alarms from 5:30 AM and never wakes up for any", "Snoozes 15 alarms between 5:30 AM and 9 AM without waking"),
                ("Talks to his long-distance partner in baby voice on speaker", "Speaks baby language on speakerphone at 2 AM")
            ]
        ),
        cr_item("cr-cc-010", ["fest"],
            "College fest mein free entry ya VIP pass ke liye kiya gaya fake identity drama?",
            "Fake credentials used to breach college fest security?",
            [
                ("Gale mein camera latka ke 'Official Press' bola", "Hung random DSLR on neck and claimed 'Official Press'"),
                ("Walkie-talkie app on karke earphone lagaya aur andar chala gaya", "Used walkie-talkie app with earphone to pose as security"),
                ("Celebrity ke makeup artist ka assistant banne ka natak", "Claimed to be celebrity guest's stage makeup assistant"),
                ("Purana ID card flash kiya aur guard ne padha hi nahi", "Flashed outdated library card; tired guard waved me in")
            ]
        ),
        cr_item("cr-cc-011", ["placement"],
            "Placement interview mein poochhe gaye question pe pheka gaya sabse bada dukh?",
            "Fake sad backstory invented during HR placement round?",
            [
                ("Told interviewer I learned Python by candlelight during village floods", "Said I learned Python by candlelight during village floods"),
                ("Claimed I built an e-commerce app to pay sister's school fees", "Claimed my college project funded my sister's schooling"),
                ("Said my biggest weakness is that I work too passionately", "Said my biggest weakness is working too hard for company goals"),
                ("Pretended to be lifelong loyal fan of that mass recruiter brand", "Pretended mass recruiter brand was my childhood inspiration")
            ]
        ),
        cr_item("cr-cc-012", ["faculty"],
            "Professor ko bheja gaya sabse desperate email?",
            "Most pathetic email sent to a strict professor for passing marks?",
            [
                ("Sir please pass me, my family's emotional stability depends on this", "Sir please pass me, my family's stability depends on it"),
                ("Claimed my laptop fell from running bus and all files got lost", "Claimed laptop fell out of running auto into river"),
                ("Addressed male professor as 'Respected Madam' by mistake", "Addressed male Dean as 'Respected Madam' in panic"),
                ("Cc mein pura department daal diya by mistake", "Accidentally CC'd all 40 faculty members in grace request")
            ]
        ),
        cr_item("cr-cc-013", ["hostel"],
            "Hostel room mein chori hui sabse priceless cheap cheez?",
            "Cheapest item stolen from your hostel room that caused a turf war?",
            [
                ("Maggie ka masala packet jo chupa ke rakha tha", "Single hidden sachet of extra Maggi magic masala"),
                ("Plastic hanger jiska hook toota hua tha", "Broken plastic coat hanger with sentimental attachment"),
                ("10 rupaye wala blue ballpoint pen", "Half-used 10-rupee ballpoint pen stolen from desk"),
                ("Chappal ka right pair jab left pair room mein hi tha", "Right slipper stolen while left slipper remained behind")
            ]
        ),
        cr_item("cr-cc-014", ["crush"],
            "Campus crush se baat shuru karne ka sabse failed icebreaker?",
            "Most disastrous icebreaker delivered to a campus crush?",
            [
                ("Do you know which formula is used in question 3 of fluid dynamics?", "Do you know the formula for question 3 in fluids?"),
                ("Tripped on stairs and dropped entire stack of printouts", "Tripped and sent 50 loose assignment sheets flying"),
                ("Walked up, forgot my own name, and asked for pen refill", "Forgot my own name and asked if they had spare pen refill"),
                ("Pretended to know their hometown and named wrong state", "Named wrong state when pretending to know their hometown")
            ]
        ),
        cr_item("cr-cc-015", ["lab"],
            "Engineering lab experiment mein ki hui sabse badi physical damage?",
            "Worst physical damage caused during an engineering lab session?",
            [
                ("Burnt digital multimeter by connecting current mode directly to mains", "Exploded digital multimeter on high-voltage test panel"),
                ("Chemistry lab mein test tube table pe gira ke acid spill", "Shattered chemical test tube and burned hole in lab stool"),
                ("Mechanical workshop mein lathe machine tool bit tod diya", "Snapped the high-speed lathe machine carbide tool bit"),
                ("Oscilloscope probe wire kheenchte waqt poora CRO gira diya", "Pulled oscilloscope cord and toppled the heavy CRO unit")
            ]
        ),
        cr_item("cr-cc-016", ["hostel"],
            "Hostel room ka safai na karne ka sabse extreme record?",
            "Most horrifying length of time an engineering room went uncleaned?",
            [
                ("One entire semester without sweeping or mopping once", "An entire 4-month semester without sweeping once"),
                ("Under-bed area had empty water bottle mountain touching bedframe", "Mountain of plastic bottles reached the underside of bed"),
                ("Bed sheet turned brown and stood upright when folded", "Bed sheet stiffened and retained shape when picked up"),
                ("Plates grew complete fuzzy moss garden under the study desk", "Fuzzy grey fungus colony colonized Maggi plates under desk")
            ]
        ),
        cr_item("cr-cc-017", ["money"],
            "Broke engineering student ke mahine ke aakhiri 3 din ka menu?",
            "Survival diet during the final 3 broke days of the month?",
            [
                ("Chai with 2 Parle-G biscuits for lunch and dinner", "Two cups of tapri chai and Parle-G biscuits per day"),
                ("Free water cooler water + dost se churaayi hui namkeen", "Free water cooler water and friends leftover namkeen"),
                ("College seminar mein attend karke free snacks pe pet bharna", "Crashing corporate seminars for free samosas and Frooti"),
                ("Borrowing 20 rupees from 5 different classmates", "Borrowing 20 rupees each from 5 different acquaintances")
            ]
        ),
        cr_item("cr-cc-018", ["cricket"],
            "Hostel corridor cricket match mein toota hua sabse expensive item?",
            "Most expensive item broken during indoor corridor cricket?",
            [
                ("Corridor emergency exit glass tube light bulb", "Emergency exit tube light shattered into 500 pieces"),
                ("Warden room ki windowpane direct tennis ball hit", "Direct smash broke the glass of the assistant warden's office"),
                ("Hostel floor fire extinguisher tamper hoke spray ho gaya", "Accidentally discharged fire extinguisher across the wing"),
                ("Dost ka laptop screen open table pe ball se cracked", "Roommate's open laptop screen cracked by a pull shot")
            ]
        ),
        cr_item("cr-cc-019", ["attendance"],
            "Medical certificate submit karke attendance bachane ka fake drama?",
            "Fake medical certificate submitted to condone attendance shortage?",
            [
                ("Local clinic se typhoid certificate banwaya jab party chal rahi thi", "Typhoid certificate from local doctor while partying in Goa"),
                ("Doctor ki handwriting itni kharab thi ki HOD ne reject kar diya", "Doctor handwriting so messy even HOD couldn't read the disease"),
                ("Dost ki stamp paper shop se seal stamp lagwayi", "Forged medical stamp using cousin's notary rubber stamp"),
                ("Dates mismatch ho gayi aur Sunday ko fracture admit dikha diya", "Accidentally showed hospital admission on national holiday")
            ]
        ),
        cr_item("cr-cc-020", ["lifestyle"],
            "Hostel washroom ke thande paani mein nahane ka reaction?",
            "Coping mechanism for bathing in freezing water during winter?",
            [
                ("Ek mug daalte hi bhagwan ka naam chillaya", "Screamed holy mantras at decibel level 100 after 1 mug"),
                ("Sirf chehra aur haath dho ke perfume spray karke class", "Washed face and hands, drowned hoodie in deodorant"),
                ("Bucket mein electric heater rod lagayi aur bhool gaya", "Left water heater rod on until bucket melted into sludge"),
                ("Nahane ke baad kapkapate hue 1 ghante rajai mein ghusa raha", "Shivered under 3 quilts for an hour post shower")
            ]
        ),
        cr_item("cr-cc-021", ["career"],
            "Off-campus job applications mein bheja gaya sabse wild resume?",
            "Most wild modification made to a resume for an off-campus job?",
            [
                ("Changed college name font so it looked like top tier institute", "Adjusted college name font to look like prestigious IIT"),
                ("Listed 'Full-Stack Lead' for building a 1-page HTML portfolio", "Listed 'Full-Stack Lead' for building a 1-page HTML site"),
                ("Invented an imaginary startup that got acquired by stealth fund", "Claimed my project was acquired by an undisclosed fund"),
                ("Claimed fluent spoken Japanese because I watch Naruto", "Claimed conversational Japanese because I completed Naruto")
            ]
        ),
        cr_item("cr-cc-022", ["hostel"],
            "Hostel laundry mein chhoot gaye kapdo ki destination?",
            "Ultimate fate of garments lost forever in campus laundry?",
            [
                ("Found senior wearing my favorite hoodie to morning canteen", "Found senior wearing my favorite hoodie to morning tea"),
                ("Warden ke pet dog ke bed pe mera purana towel bicha tha", "Found my branded towel lining the guard dog's crate"),
                ("T-shirt shrink hoke 5 saal ke bacche ke size ki ho gayi", "Cotton t-shirt shrank into a doll-sized crop top"),
                ("Dhobi ne bola 'Bhai ye kapda to mere paas kabhi aaya hi nahi'", "Washerman looked into my eyes and denied shirt's existence")
            ]
        ),
        cr_item("cr-cc-023", ["academics"],
            "Exam hall mein Invigilator ko distract karne ka group masterplan?",
            "Master plan executed to distract the exam invigilator?",
            [
                ("Dost ne pretend kiya ki uski tabiyat bohot kharab hai", "Friend faked sudden stomach cramps to draw teacher away"),
                ("Water dispenser girane ka drama kiya piche ke benches ne", "Loudly toppled water bottle so front row could swap papers"),
                ("Dost ne continuous silly doubts pooche syllabus se bahar ke", "Asked 15 minute philosophical clarification on Question 1"),
                ("Dropped pen and crawled under 3 desks searching for it", "Crawled under three desks pretending to search for pen cap")
            ]
        ),
        cr_item("cr-cc-024", ["campus"],
            "Campus security guard se bachne ke liye banaya gaya code word?",
            "Code words invented to alert friends of arriving security guards?",
            [
                ("'Red Alert 10' chillana corridor ke end se", "Shouting 'Weather report bad' from the wing entrance"),
                ("Room ke light switches 3 baar on-off flick karna", "Flickering hallway light switches three times"),
                ("Fake whistling sound jo poore wing mein warning bhej de", "Specific high-pitch whistle that signals sudden inspection"),
                ("WhatsApp group pe bas single red siren emoji post karna", "Spamming single red siren emoji on the floor group chat")
            ]
        ),
        cr_item("cr-cc-025", ["projects"],
            "Engineering college mein banaya gaya sabse useless smart device?",
            "Most useless 'Smart IoT Device' built for academic credits?",
            [
                ("Smart dustbin that opens with ultrasonic sensor (takes 10 secs)", "Smart dustbin that takes 10 seconds to open ultrasonic lid"),
                ("Plant watering robot that flooded the entire living room", "Automatic plant waterer that flooded the lab floor"),
                ("Smart door lock that locked the creators outside their room", "Fingerprint door lock that permanently locked team outside"),
                ("Bluetooth controlled fan that overheats after 30 seconds", "Bluetooth fan controller that shorted out in 30 seconds")
            ]
        ),
        cr_item("cr-cc-026", ["hostel"],
            "Hostel night out pe dosto ke saath kiya gaya sabse cheap adventure?",
            "Cheapest night out adventure pulled by broke hostelers?",
            [
                ("Railway station platform pe baith ke 10 rupaye ki chai pee", "Sitting on railway platform 1 drinking 10-rupee chai"),
                ("Airport parking ke bahar baith ke flights takeoff dekha", "Sitting outside perimeter fence watching flights take off"),
                ("Highway toll plaza tak walk karke wapas aa gaye", "Walking 6 kilometers to the highway toll gate and back"),
                ("Hospital emergency waiting room ke TV pe match dekha", "Watching cricket in the hospital trauma waiting room")
            ]
        ),
        cr_item("cr-cc-027", ["faculty"],
            "Teacher's Day par faculty ko diya gaya sabse cheap greeting?",
            "Most low-effort greeting presented to faculty on Teacher's Day?",
            [
                ("Single wilted rose jo raste ke garden se toda tha", "Single wilted rose plucked from the college lawn 2 min prior"),
                ("Whiteboard pe marker se 'You are the best Sir' likh ke bhage", "Wrote 'Best Sir Ever' on whiteboard and sprinted out"),
                ("Old diary gift ki jismein pehle ke do page faade hue the", "Gifted leftover corporate diary with first two pages torn out"),
                ("WhatsApp forwarded quote jismein 'Dear Teacher' tha", "Generic forwarded quote that misspelled the professor's name")
            ]
        ),
        cr_item("cr-cc-028", ["academics"],
            "Grace marks paane ke liye answer sheet mein likha sabse emotional kissa?",
            "Most emotional tearjerker plea written on the final page of exam sheet?",
            [
                ("Sir please give 5 marks, sister's marriage fixed on my graduation", "Sir give 5 grace marks, sister's wedding depends on degree"),
                ("Drew big diagrams of hearts and circuit symbols combined", "Drew giant heart diagrams around failed numerical problems"),
                ("Wrote complete lyrics of patriotic song to fill extra booklet", "Wrote lyrics of patriotic anthems to fill the supplementary sheet"),
                ("Sir my pen ran out of ink so please consider my intention", "Sir my pen ran out of ink so please imagine the remaining proof")
            ]
        ),
        cr_item("cr-cc-029", ["hostel"],
            "Wing ke dosto ke saath midnight birthday party ka destruction level?",
            "Extent of destruction during a midnight hostel wing birthday?",
            [
                ("Corridor walls coated in whipped cream and chocolate smear", "Corridor walls smeared with cheap synthetic whipped cream"),
                ("Room door hinges broke from too many people pushing", "Room door came off its hinges from excessive pushing"),
                ("Birthday boy tied to study chair with plastic packing tape", "Birthday boy taped to spinning office chair in hallway"),
                ("Fire alarm sensor covered with wet tissue to avoid water spray", "Wet tissue wrapped around smoke detector to silence alarms")
            ]
        ),
        cr_item("cr-cc-030", ["campus"],
            "Final semester convocation ke din sabse bada realization?",
            "Biggest shock realization on the final day of college graduation?",
            [
                ("Degree mil gayi par abhi bhi nahi pata engineer kya karta hai", "Degree in hand, still zero clue what an engineer actually does"),
                ("Hostel security deposit refund aane mein 6 saal lagenge", "Hostel deposit refund will take 6 years of administrative forms"),
                ("Never going to see 80% of these classmates ever again", "Never going to cross paths with 80% of these batchmates again"),
                ("Canteen wale bhaiya ka 450 rupaye ka khata abhi bhi baki hai", "Still owe 450 rupees on the canteen uncle's secret credit ledger")
            ]
        )
    ]

    return [
        {"id": "fake-flexes", "name": "Fake Flexes", "level": "spicy", "items": ff},
        {"id": "digital-confessions", "name": "Digital Life Confessions", "level": "spicy", "items": dc},
        {"id": "campus-confessions", "name": "Campus Confessions", "level": "unhinged", "items": camp}
    ]
