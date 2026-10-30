def get_hotseat_packs(loc, base):
    def hs_item(item_id, tags, prompt_h, prompt_e, item_type="one-word", options=None, level="spicy"):
        item = dict(
            base(item_id, tags, level),
            prompt=loc(prompt_h, prompt_e),
            type=item_type
        )
        if options:
            item["options"] = [loc(oh, oe) for oh, oe in options]
        return item

    arch_options = [
        ("Topper (Kitabi Keeda)", "The Academic Topper"),
        ("Backbencher (Sleeping Legend)", "The Backbencher Legend"),
        ("Proxy King (Master of Attendance)", "The Proxy King"),
        ("Jugaadu (Crisis Specialist)", "The Jugaadu Hacker"),
        ("Placement Prophet (LinkedIn Influencer)", "The Placement Prophet")
    ]

    ca = [
        hs_item("hs-ca-001", ["archetype"], "Hot Seat wale bande ka sabse accurate college archetype kya hai?", "Which college archetype best describes the player in the Hot Seat?", "archetype", arch_options),
        hs_item("hs-ca-002", ["biopic"], "Agar is bande ki life pe Bollywood film bane to title kya hoga?", "If a Bollywood biopic were made on their life, what would the title be?", "biopic"),
        hs_item("hs-ca-003", ["linkedin"], "Is bande ka sabse honest LinkedIn headline kya hona chahiye?", "What should their most brutally honest LinkedIn headline actually say?", "linkedin"),
        hs_item("hs-ca-004", ["rating"], "Group project mein is bande ke sath kaam karne ki rating 1 se 10 mein?", "Rate working with this person on a critical group project (1 to 10)", "rating"),
        hs_item("hs-ca-005", ["one-word"], "Is bande ko ek single word mein describe karo", "Describe this person using exactly one single word", "one-word"),
        hs_item("hs-ca-006", ["rating"], "Raat ke 3 baje crisis ke waqt isko call karne ki reliability rating (1-10)?", "Reliability rating if you call them during a 3 AM crisis (1 to 10)", "rating"),
        hs_item("hs-ca-007", ["biopic"], "Netflix show bane to iska season 1 finale episode title kya hoga?", "If they had a Netflix series, what is the Season 1 finale episode title?", "biopic"),
        hs_item("hs-ca-008", ["linkedin"], "Is bande ki special superpower skill resume pe kya likhi honi chahiye?", "What secret superpower should be listed on their resume?", "linkedin"),
        hs_item("hs-ca-009", ["one-word"], "Inke viva exam room mein ghuste hi examiner ka pehla thought?", "The examiner's first thought when this person walks into viva room", "one-word"),
        hs_item("hs-ca-010", ["archetype"], "Exam hall mein ye banda kaunsa role play karta hai?", "What role does this person naturally play inside the exam hall?", "archetype", [
            ("Master of Chits (Covert Spy)", "Master of Covert Notes"),
            ("Panic Broadcaster (Daraane Wala)", "Panic Broadcaster"),
            ("Silent Genius (Akele Pass Hoga)", "Silent Solo Survivor"),
            ("Sleeper (Paper ke upar so gaya)", "Desk Dozer"),
            ("Extra Sheet Intimidator", "Extra Sheet Intimidator")
        ]),
        hs_item("hs-ca-011", ["rating"], "Agar isko hostel warden bana diya jaye to kitna strict hoga (1-10)?", "How strict would they be if appointed Chief Hostel Warden (1 to 10)?", "rating"),
        hs_item("hs-ca-012", ["biopic"], "Inke life story ka dramatic suspense interval scene kya hoga?", "What is the dramatic interval scene of their life movie?", "biopic"),
        hs_item("hs-ca-013", ["one-word"], "Inka phone browser khulte hi pehla impression kya aayega?", "First reaction if you suddenly open their mobile browser tabs?", "one-word"),
        hs_item("hs-ca-014", ["linkedin"], "Inki corporate career strategy in one sentence?", "Their ultimate corporate career survival strategy in one sentence?", "linkedin"),
        hs_item("hs-ca-015", ["rating"], "Inse secret share karne ki safety rating (1-10)?", "Safety rating when telling them a sensitive group secret (1 to 10)?", "rating"),
        hs_item("hs-ca-016", ["one-word"], "Classroom mein professor ke achanak sawal poochne par inka face?", "Their facial expression when the professor asks them a direct question?", "one-word"),
        hs_item("hs-ca-017", ["biopic"], "Inke 20 saal baad ka autobiographical book title?", "Title of their autobiography published 20 years from now?", "biopic"),
        hs_item("hs-ca-018", ["archetype"], "Hostel party ya trip mein ye banda kis category mein fit hota hai?", "What role do they fill on a wild group trip or party?", "archetype", [
            ("DJ & Auxiliary Cable Tyrant", "DJ & Aux Cable Dictator"),
            ("Snack Finisher (Bhukkad)", "Chief Snack Vacuum"),
            ("Map Navigator (Wrong Way Guru)", "Wrong Turn Navigator"),
            ("First To Sleep In Corner", "First To Pass Out In Corner"),
            ("Photographer & Aesthetic Director", "Aesthetic Photo Director")
        ]),
        hs_item("hs-ca-019", ["rating"], "Agar ye startup banayein to invest karne ka confidence (1-10)?", "Confidence level in investing your life savings in their startup (1 to 10)?", "rating"),
        hs_item("hs-ca-020", ["one-word"], "Inke daily routine ko describe karne wala word?", "A single word summarizing their standard 24-hour daily routine?", "one-word"),
        hs_item("hs-ca-021", ["linkedin"], "Is bande ka secret LinkedIn endorsement skill kya hona chahiye?", "What funny skill should their connections officially endorse them for?", "linkedin"),
        hs_item("hs-ca-022", ["rating"], "Inki street fight ya argument jeetne ki probability (1-10)?", "Probability rating of them winning a heated verbal debate (1 to 10)?", "rating"),
        hs_item("hs-ca-023", ["biopic"], "Inke graduation day par inka background music theme song?", "Their entrance theme music song on college graduation day?", "biopic"),
        hs_item("hs-ca-024", ["one-word"], "Inke wardrobe ya kapdo ke fashion sense ko describe karne wala word?", "One word summarizing their personal hostel fashion sense?", "one-word"),
        hs_item("hs-ca-025", ["rating"], "Inko airport drop lene ki reliability rating agar flight subah ho (1-10)?", "Reliability rating of them waking up to drop you for a 6 AM flight (1-10)?", "rating"),
        hs_item("hs-ca-026", ["biopic"], "Inki biography ka villain kaun hoga?", "Who would be the chief arch-nemesis in their life story?", "biopic"),
        hs_item("hs-ca-027", ["one-word"], "Inke room ki messy table dekh ke visitor ka reaction?", "A visitor's immediate reaction looking at their study table?", "one-word"),
        hs_item("hs-ca-028", ["archetype"], "Campus placement marathon mein ye banda kya karta milega?", "What will they be caught doing during campus placement week?", "archetype", [
            ("Ironing Formal Suit at 2 AM", "Midnight Formal Suit Ironer"),
            ("Giving Motivational Speeches in Canteen", "Canteen Motivational Guru"),
            ("Panic Cramming Bubble Sort", "Panic Cramming Basic Algorithms"),
            ("Napping in AC Holding Room", "Sleeping in the Holding Hall"),
            ("Calculating CTC in Excel Sheets", "Spreadsheet CTC Calculator")
        ]),
        hs_item("hs-ca-029", ["rating"], "Inke sath 1 mahine akele island pe survive karne ka rating (1-10)?", "Survival rating if trapped on a desert island with them for a month (1-10)?", "rating"),
        hs_item("hs-ca-030", ["one-word"], "Inke signature dialogue ya catchphrase ka core essence?", "The core essence of their most repeated catchphrase in one word?", "one-word")
    ]

    hr = [
        hs_item("hs-hr-001", ["roast"], "Is bande ke room mein ghuste hi sabse pehle kya warning sign milta hai?", "What is the biggest warning sign when stepping into their room?", "one-word"),
        hs_item("hs-hr-002", ["biopic"], "Agar inke hostel adventures pe thriller movie bane to tag line kya hogi?", "If their hostel life was a thriller, what is the movie tagline?", "biopic"),
        hs_item("hs-hr-003", ["rating"], "Mess ka khana bina complaint kare kha lene ka inka stamina (1-10)?", "Their resilience score for eating awful mess food without complaining (1-10)?", "rating"),
        hs_item("hs-hr-004", ["linkedin"], "Inki real-life hostel life ka viral LinkedIn post ka opening hook?", "Opening hook of their imaginary LinkedIn post on hostel life?", "linkedin"),
        hs_item("hs-hr-005", ["one-word"], "Raat ke 2 baje ye banda corridor mein kis vibe mein milta hai?", "What vibe do they exude when roaming the corridor at 2 AM?", "one-word"),
        hs_item("hs-hr-006", ["rating"], "Inse mobile hotspot maangne par 'password galat hai' bolne ka chance (1-10)?", "Probability they give you the wrong hotspot password on purpose (1-10)?", "rating"),
        hs_item("hs-hr-007", ["biopic"], "Inke mess secretary banne par documentary ka title?", "Title of the documentary if they were elected Mess Secretary?", "biopic"),
        hs_item("hs-hr-008", ["one-word"], "Inke kettle ke andar jo pakta hai usko ek word mein define karo", "Define the mysterious concoctions cooked inside their kettle in one word", "one-word"),
        hs_item("hs-hr-009", ["rating"], "Wing mein sudden warden raid aane par inke escape hone ki rating (1-10)?", "Survival rating during a surprise late-night warden raid (1-10)?", "rating"),
        hs_item("hs-hr-010", ["roast"], "Is bande ko subah uthane ke liye sabse dangerous method kya hai?", "The most extreme method required to wake this person from sleep?", "one-word"),
        hs_item("hs-hr-011", ["biopic"], "Inke dosto se udhaar lene ke tactics pe banne wali mini-series?", "Title of the mini-series exploring their innovative borrowing tactics?", "biopic"),
        hs_item("hs-hr-012", ["rating"], "Winter mein bina geyser ke garam paani ke bina nahane ka courage (1-10)?", "Their willingness to shower without hot water in peak winter (1-10)?", "rating"),
        hs_item("hs-hr-013", ["linkedin"], "Inki room cleaning strategy ka corporate buzzword?", "Corporate jargon describing their room cleaning strategy?", "linkedin"),
        hs_item("hs-hr-014", ["one-word"], "Inke birthday bumps GPL ke waqt inka facial expression?", "Their exact expression when receiving brutal birthday bumps?", "one-word"),
        hs_item("hs-hr-015", ["rating"], "Inke plate se Maggi ka ek chamach chura lene par survival rate (1-10)?", "Survival rate of anyone attempting to steal a bite of their Maggi (1-10)?", "rating"),
        hs_item("hs-hr-016", ["biopic"], "Inke phone charge lagane ke jagah ki ladayi pe documentary title?", "Documentary title on their turf wars over hostel charging sockets?", "biopic"),
        hs_item("hs-hr-017", ["one-word"], "Inke cupboard kholne par aane wali cheezon ki summary?", "Summary word for the avalanche that falls out when their cupboard opens?", "one-word"),
        hs_item("hs-hr-018", ["rating"], "Inka late night tapri pe 10 rupaye sponsor karne ka probability (1-10)?", "Likelihood of them voluntarily sponsoring 10-rupee chai at tapri (1-10)?", "rating"),
        hs_item("hs-hr-019", ["roast"], "Inke room mein padhai ke naam par jo actually hota hai?", "What actually happens in their room under the guise of 'group study'?", "one-word"),
        hs_item("hs-hr-020", ["biopic"], "Hostel WiFi crash hone par inke reaction pe movie?", "Action film title based on their fury when campus Wi-Fi drops?", "biopic"),
        hs_item("hs-hr-021", ["rating"], "Inki room ki balcony se papad ya chappal girane ka risk (1-10)?", "Risk rating of them dropping random items from the balcony (1-10)?", "rating"),
        hs_item("hs-hr-022", ["one-word"], "Inke laundered kapde wapas aane par pehla reaction?", "Their reaction when dhobi returns clothes with mysterious holes?", "one-word"),
        hs_item("hs-hr-023", ["linkedin"], "Inke attendance shortage justify karne ka official email tone?", "Official tone of their email explaining 30% attendance shortage?", "linkedin"),
        hs_item("hs-hr-024", ["rating"], "Inko exam morning alarm clock banana kitna reliable hai (1-10)?", "Reliability of relying on them as your exam-day human wake-up alarm (1-10)?", "rating"),
        hs_item("hs-hr-025", ["biopic"], "Inke late-night food ordering addiction par crime docu-series?", "Crime documentary title on their late-night junk food delivery bills?", "biopic"),
        hs_item("hs-hr-026", ["one-word"], "Inke cricket shot se corridor light phootne par inka look?", "Their face when their pull shot shatters the hallway tube light?", "one-word"),
        hs_item("hs-hr-027", ["rating"], "Inke roommate ke patience ka endurance rating (1-10)?", "Endurance and sainthood rating required to be their roommate (1-10)?", "rating"),
        hs_item("hs-hr-028", ["roast"], "Inke bed sheet ko washing machine mein daalne ka urgency level?", "Urgency level of getting their bedsheet into an industrial washing cycle?", "one-word"),
        hs_item("hs-hr-029", ["biopic"], "Inki final hostel checkout clearance ceremony ka biopic climax?", "The climax scene where they finally clear all hostel dues and deposits?", "biopic"),
        hs_item("hs-hr-030", ["one-word"], "Inke 4 saal ke hostel journey ko sum up karne wala final word?", "The ultimate single word summarizing their entire 4-year hostel journey?", "one-word")
    ]

    return [
        {"id": "campus-archetypes", "name": "Campus & College Archetypes", "level": "spicy", "items": ca},
        {"id": "hostel-roasts", "name": "Hostel Life & Wing Roasts", "level": "unhinged", "items": hr}
    ]
