def get_garma_packs(loc, base):
    def gg_item(item_id, tags, st_h, st_e, level="spicy"):
        return dict(
            base(item_id, tags, level),
            statement=loc(st_h, st_e)
        )

    ct = [
        gg_item("gg-ct-001", ["college"], "Backlog aana failure nahi, engineering personality ka canon event hai.", "Having backlogs isn't failure; it's essential engineering character development."),
        gg_item("gg-ct-002", ["attendance"], "75% attendance rule sirf ego satisfying mechanism hai, padhai se lena dena nahi.", "The 75% attendance rule is pure ego satisfaction; it has zero learning value."),
        gg_item("gg-ct-003", ["career"], "Online certificates aur badges resume pe time-waste hain, koi recruiter nahi dekhta.", "Online completion certificates are total resume fluff; recruiters ignore them."),
        gg_item("gg-ct-004", ["hostel"], "Hostel wale students day scholars se zyada life aur crisis management seekhte hain.", "Hostelers learn far better real-world crisis management than day scholars."),
        gg_item("gg-ct-005", ["college"], "Group projects mein freeloading karna bhi ek high-level corporate negotiation skill hai.", "Freeloading in group projects is actually an advanced corporate political skill."),
        gg_item("gg-ct-006", ["tech"], "DSA aur LeetCode grind karna intelligence nahi, brute force ratta marna hai.", "Grinding 500 LeetCode problems isn't smartness; it's brute force memorization."),
        gg_item("gg-ct-007", ["mess"], "Mess ka khana itna kharab hona zaroori hai taaki students kettle cooking master karein.", "Terrible mess food is necessary so students develop life-long cooking survival skills."),
        gg_item("gg-ct-008", ["career"], "Mass recruiter companies ko gaali dene wale placement day pe sabse pehle wahi baithte hain.", "Those who mock mass recruiters are the very first in line when placement opens."),
        gg_item("gg-ct-009", ["college"], "College ke fests pe lakho kharch karna useless hai jab labs mein instruments na ho.", "Spending millions on fest celebrities while labs have broken meters is absurd."),
        gg_item("gg-ct-010", ["viva"], "Viva mein marks knowledge ke nahi, bas eye-contact aur confident posture ke milte hain.", "Viva marks are 90% body language and posture, 10% actual subject knowledge."),
        gg_item("gg-ct-011", ["attendance"], "Proxy lagwana crime nahi, wing brotherhood ka mandatory fundamental duty hai.", "Calling a proxy isn't cheating; it is an unspoken fundamental brotherhood duty."),
        gg_item("gg-ct-012", ["career"], "College CGPA sirf pehle job interview tak matter karta hai, uske baad koi nahi poochta.", "College CGPA stops mattering five minutes after your very first corporate job."),
        gg_item("gg-ct-013", ["college"], "Engineers ko 4 saal mein engineering ke alawa duniya ka har kaam seekhne ko milta hai.", "Engineers learn literally everything about survival in 4 years except engineering."),
        gg_item("gg-ct-014", ["tech"], "Hackathon jeetne ke liye coding se 10 guna zyada fancy PPT aur dramatic story chahiye.", "Winning hackathons is 90% dramatic slide storytelling and 10% actual code."),
        gg_item("gg-ct-015", ["hostel"], "Roommate agar introverted ho to wo blessing hai, over-enthusiastic roommate nightmare hota hai.", "A quiet introvert roommate is a blessing; an over-enthusiastic one is a nightmare."),
        gg_item("gg-ct-016", ["career"], "LinkedIn culture pura toxic mutual admiration club ban chuka hai.", "LinkedIn has devolved into a dystopian circle of fake mutual admiration."),
        gg_item("gg-ct-017", ["college"], "One-night study sessions mein 4 mahine ke syllabus se zyada clarity aati hai.", "One frantic night of exam study brings more clarity than 4 months of lectures."),
        gg_item("gg-ct-018", ["faculty"], "Strict professors andar se bohot insecure hote hain isliye strictness ka mask pehante hain.", "Overly strict professors act harsh only to mask their own teaching insecurity."),
        gg_item("gg-ct-019", ["lifestyle"], "Hostel tapri ki 10 rupaye ki cutting chai Starbuck ke 400 rupaye ke cup se 100x behtar hai.", "A 10-rupee campus tapri cutting chai beats a 400-rupee Starbucks cup any day."),
        gg_item("gg-ct-020", ["academics"], "Engineering drawing manual se karwana 2026 mein torture hai jab CAD tools exist karte hain.", "Drawing manual isometric sheets in 2026 is pure torture when CAD tools exist."),
        gg_item("gg-ct-021", ["career"], "Referral milna talent se 100x zyada powerful hai modern job market mein.", "Landing a solid internal referral beats sheer technical talent 10 to 1."),
        gg_item("gg-ct-022", ["college"], "CR (Class Representative) banna career ka sabse worst decision hai jo koi student le sakta hai.", "Becoming Class Representative is the single worst voluntary mistake a student can make."),
        gg_item("gg-ct-023", ["lifestyle"], "College canteen ka cold samosa aur watery Maggi ek emotional comfort food hai.", "Soggy cold canteen samosas and soupy Maggi are peak tier-3 comfort food."),
        gg_item("gg-ct-024", ["tech"], "AI coding assistants aane ke baad 80% computer science engineering syllabus obsolete hai.", "With AI coding tools, 80% of our university computer science syllabus is obsolete."),
        gg_item("gg-ct-025", ["hostel"], "Warden ko bribe ya appease karna management student ke syllabus se zyada practical hai.", "Managing a volatile hostel warden teaches more negotiation than MBA programs."),
        gg_item("gg-ct-026", ["academics"], "Tier-3 colleges ko placement cell se zyada therapy cell ki zaroorat hai.", "Tier-3 engineering colleges need professional therapy cells more than placement cells."),
        gg_item("gg-ct-027", ["college"], "Front benchers jo teacher ke har joke pe hanste hain, unko sabse zyada trust nahi karna chahiye.", "Never trust front benchers who laugh unconditionally at professors' terrible jokes."),
        gg_item("gg-ct-028", ["career"], "Off-campus placement crack karna lottery ticket jeetne se zyada hard hai.", "Cracking an off-campus engineering offer today is harder than winning the lottery."),
        gg_item("gg-ct-029", ["lifestyle"], "Hostel room ka safai na hona creativity aur deep thinking ko foster karta hai.", "A chaotic, unorganized hostel room fosters true chaotic creativity and deep thought."),
        gg_item("gg-ct-030", ["college"], "Degree ki value sirf paper ki hai, asal dost jo hostel mein bante hain wahi asset hain.", "The paper degree is worthless; the wing friends you survive with are the real asset.")
    ]

    lpc = [
        gg_item("gg-lp-001", ["relationships"], "Long-distance relationships college mein 95% cases mein semester 3 tak khatam ho jaate hain.", "College long-distance relationships statistically dissolve by semester 3."),
        gg_item("gg-lp-002", ["social-media"], "Story pe relationship declare karna (soft launch) validation ki bhookh hai.", "Soft-launching relationships on Instagram stories is just hunger for attention."),
        gg_item("gg-lp-003", ["money"], "Friends ke sath splitwise hisaab ek-ek rupaye ka karna dosti ko destroy karta hai.", "Tracking Splitwise debts down to the single rupee ruins deep friendships."),
        gg_item("gg-lp-004", ["entertainment"], "Modern Bollywood content se 10 guna zyada sensible aur entertaining South Indian dubs hain.", "South Indian mass cinema dubs are 10 times more entertaining than modern Bollywood."),
        gg_item("gg-lp-005", ["lifestyle"], "Subah 5 AM uthna overrated lifestyle propaganda hai, raat ke 2 AM deep work hota hai.", "5 AM mornings are hustle propaganda; peak creative flow happens at 2 AM."),
        gg_item("gg-lp-006", ["food"], "Biryani mein elaichi aana crime nahi, test of patience hai.", "Biting into a whole cardamom pod in biryani builds true emotional resilience."),
        gg_item("gg-lp-007", ["dating"], "Dating apps pe 90% log sirf validation aur screen-time timepass ke liye aate hain.", "90% of dating app users are only on there for validation and bored scrolling."),
        gg_item("gg-lp-008", ["fitness"], "Gym mirror selfies lene wale log workout se zyada lighting mein interested hote hain.", "Gym mirror selfie posters care 80% about gym lighting and 20% about the lift."),
        gg_item("gg-lp-009", ["social"], "Voice note bhejna text karne se zyada selfish hai kyunki receiver ka time waste hota hai.", "Sending 3-minute voice notes is selfish; typing takes effort and respects time."),
        gg_item("gg-lp-010", ["habits"], "Reels scroll karte waqt phone muh pe girna phone ka tumko shaming karne ka tareeqa hai.", "Dropping your phone on your nose while scrolling is your phone fat-shaming your brain."),
        gg_item("gg-lp-011", ["travel"], "Goa plan banana par cancel ho jana Indian youth ka national hobby hai.", "Planning a Goa trip and canceling it is the official national hobby of Indian youth."),
        gg_item("gg-lp-012", ["pop-culture"], "Reality shows jaise Bigg Boss aur Roadies guilty pleasure nahi, pure brain damage hain.", "Watching Indian reality television isn't a guilty pleasure; it's voluntary brain damage."),
        gg_item("gg-lp-013", ["lifestyle"], "Tea tapri pe baith ke political gyan pelne wale khud voting day pe so rahe hote hain.", "Those giving heated tea-stall political gyan are asleep at noon on voting day."),
        gg_item("gg-lp-014", ["music"], "Auto-tuned Punjabi songs aur club music sab ek hi beat pe chal rahe hain 5 saal se.", "Every viral club song has used the exact same synthesized beat for 5 years."),
        gg_item("gg-lp-015", ["relationships"], "Ex ke sath 'just good friends' rehna emotional self-sabotage hai.", "Staying 'just good friends' with an ex is the purest form of emotional self-sabotage."),
        gg_item("gg-lp-016", ["money"], "Expensive brand sneakers pehen ke metro ya bus mein khade rehna peak irony hai.", "Standing in a packed public bus wearing 15,000 rupee sneakers is peak irony."),
        gg_item("gg-lp-017", ["food"], "Street side momos aur spicy red chutney five-star Chinese food se 100 guna better hain.", "Street-side steamed momos with spicy garlic chutney destroy 5-star dim sums."),
        gg_item("gg-lp-018", ["social-media"], "Close Friends story feature drama create karne ke liye intentionally banaya gaya hai.", "The Close Friends story feature was engineered solely to incite psychological warfare."),
        gg_item("gg-lp-019", ["career"], "WFH (Work from Home) mein log din mein 2 ghante se zyada actual kaam nahi karte.", "80% of remote tech workers do no more than 2 hours of actual focused work per day."),
        gg_item("gg-lp-020", ["dating"], "Dating app bio mein 'Fluent in sarcasm' likhne wale log sabse boring hote hain.", "People who write 'fluent in sarcasm' in their bios are the driest conversationalists."),
        gg_item("gg-lp-021", ["lifestyle"], "Pahadon mein jaake 'Finding myself' bolna rich kids ka Instagram flex hai.", "Going to the mountains to 'find yourself' is just an aesthetic rich-kid flex."),
        gg_item("gg-lp-022", ["habits"], "Subah alarm snooze karke 10 minute sone ka comfort duniya ka best pleasure hai.", "Hitting snooze and getting that 10-minute bonus sleep is the purest human luxury."),
        gg_item("gg-lp-023", ["pop-culture"], "Marvel aur superhero movies 2019 ke baad completely unwatchable garbage ban chuki hain.", "Superhero cinematic universes became completely unwatchable garbage after 2019."),
        gg_item("gg-lp-024", ["technology"], "Smartwatches sirf anxiety badhane ke liye notification vibration generate karti hain.", "Smartwatches exist primarily to vibrate anxiety into your wrist every 30 seconds."),
        gg_item("gg-lp-025", ["relationships"], "Ghosting karna rude hai, par 10-page ka breakup essay bhejna usse bhi zyada exhausting hai.", "Ghosting is bad, but sending a 10-page psychological exit interview is worse."),
        gg_item("gg-lp-026", ["lifestyle"], "Podcasts ko 1.5x speed pe sunne wale log bas content consume karne ka illusion bana rahe hain.", "Listening to podcasts at 1.5x speed is just the illusion of efficient learning."),
        gg_item("gg-lp-027", ["shopping"], "Online sale mein cheez sasti milne ke chakar mein log double faltu kharcha karte hain.", "Mega online sales don't save money; they trick people into hoarding useless garbage."),
        gg_item("gg-lp-028", ["social"], "Birthday pe public mein dosto ke saamne awkward khade rehke taali bajwana punishment hai.", "Standing awkwardly while people sing Happy Birthday at you in public is punishment."),
        gg_item("gg-lp-029", ["food"], "Pizza pe extra cheese daalna taste kharab karta hai, balance important hai.", "Drowning a pizza in liquid processed cheese ruins the entire flavor profile."),
        gg_item("gg-lp-030", ["life"], "20s mein sab sorted hona myth hai; sabhi log bas confident dikhne ka drama kar rahe hain.", "Having life sorted in your 20s is a complete myth; everyone is just acting confident.")
    ]

    return [
        {"id": "campus-takes", "name": "Campus & Engineering Takes", "level": "spicy", "items": ct},
        {"id": "life-and-pop-culture", "name": "Life & Pop Culture Takes", "level": "spicy", "items": lpc}
    ]
