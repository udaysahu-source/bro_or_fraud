def get_nhie_packs(loc, base):
    def nhie_item(item_id, tags, st_h, st_e, level="mild"):
        # Assert length <= 90 chars
        if len(st_h) > 90:
            raise ValueError(f"NHIE hinglish statement too long ({len(st_h)} chars): '{st_h}'")
        if len(st_e) > 90:
            raise ValueError(f"NHIE en statement too long ({len(st_e)} chars): '{st_e}'")
        return dict(
            base(item_id, tags, level),
            statement=loc(st_h, st_e)
        )

    dd = [
        nhie_item("nhie-dd-001", ["social"], "Maine kabhi story sirf ek person ke dekhne ke liye daali.", "Never have I ever posted a story mainly for one person to see.", "mild"),
        nhie_item("nhie-dd-002", ["social"], "Maine kisi ka account itna stalk kiya ki 2017 tak pahunch gaya.", "Never have I ever stalked someone so deep I reached 2017.", "mild"),
        nhie_item("nhie-dd-003", ["chat"], "Maine lamba reply likha, delete kiya, aur bas 'lol' bhej diya.", "Never have I ever typed an essay, deleted it, and sent 'lol'.", "mild"),
        nhie_item("nhie-dd-004", ["dating"], "Maine online unbothered banne ka natak kiya par anxious tha.", "Never have I ever pretended not to care while tracking signals.", "spicy"),
        nhie_item("nhie-dd-005", ["phone"], "Maine achanak phone khola aur bhool gaya kya dekhna tha.", "Never have I ever opened an app and forgotten why I opened it.", "mild"),
        nhie_item("nhie-dd-006", ["music"], "Maine story pe song lagaya indirectly message convey karne ke liye.", "Never have I ever put a song on a story as a subtle hint.", "mild"),
        nhie_item("nhie-dd-007", ["dating"], "Maine pehle se rehearse kiya ki crush se milke kya bolunga.", "Never have I ever rehearsed how I'd act meeting someone.", "mild"),
        nhie_item("nhie-dd-008", ["social"], "Maine story views check karke pura conspiracy theory banaya.", "Never have I ever checked story views and made up theories.", "mild"),
        nhie_item("nhie-dd-009", ["chat"], "Maine screenshot save karke rakha future argument ke liye.", "Never have I ever kept a screenshot as evidence for arguments.", "spicy"),
        nhie_item("nhie-dd-010", ["chat"], "Maine bola 'mai offline hu' par secretly reels dekh raha tha.", "Never have I ever claimed I was offline while actively scrolling.", "mild"),
        nhie_item("nhie-dd-011", ["social"], "Maine kisi ko Close Friends se remove kiya gusse mein.", "Never have I ever booted someone off Close Friends in anger.", "spicy"),
        nhie_item("nhie-dd-012", ["chat"], "Maine janbujhkar ghanto baad reply kiya unbothered dikhne ke liye.", "Never have I ever delayed a reply just to look unbothered.", "mild"),
        nhie_item("nhie-dd-013", ["social"], "Maine post pe like count kam aane par use delete kar diya.", "Never have I ever deleted a post because of low likes.", "mild"),
        nhie_item("nhie-dd-014", ["phone"], "Maine screen time 8 ghante paar dekh ke khud ko justify kiya.", "Never have I ever justified an 8-hour daily screen time.", "mild"),
        nhie_item("nhie-dd-015", ["social"], "Maine fake account banaya kisi ko stalk karne ke liye.", "Never have I ever created a burner account to stalk someone.", "unhinged"),
        nhie_item("nhie-dd-016", ["chat"], "Maine voice note bhejne ke baad khud hi use 5 baar suna.", "Never have I ever listened to my own voice note 5 times.", "mild"),
        nhie_item("nhie-dd-017", ["social"], "Maine kisi ki purani post galti se like karke panic kiya.", "Never have I ever accidentally liked an old photo in panic.", "spicy"),
        nhie_item("nhie-dd-018", ["chat"], "Maine typing status dekh ke app band kar diya.", "Never have I ever closed the app when seeing 'typing...'.", "mild"),
        nhie_item("nhie-dd-019", ["phone"], "Maine phone bed pe gira ke apne chehre pe maara.", "Never have I ever dropped my phone directly on my face.", "mild"),
        nhie_item("nhie-dd-020", ["social"], "Maine aesthetic photo ke liye 50 retakes liye.", "Never have I ever taken 50 retakes for one aesthetic pic.", "mild"),
        nhie_item("nhie-dd-021", ["chat"], "Maine WhatsApp call disconnect karke bola 'network problem hai'.", "Never have I ever cut a call and blamed poor network.", "mild"),
        nhie_item("nhie-dd-022", ["music"], "Maine Spotify wrap aane par cool dikhne ke liye share kiya.", "Never have I ever posted my music wrap just to look cool.", "mild"),
        nhie_item("nhie-dd-023", ["social"], "Maine group chat ko hamesha ke liye mute par daal diya.", "Never have I ever muted a group chat permanently.", "mild"),
        nhie_item("nhie-dd-024", ["dating"], "Maine crush ke online aane ka ghanto wait kiya.", "Never have I ever waited hours for a crush to come online.", "spicy"),
        nhie_item("nhie-dd-025", ["phone"], "Maine 1% battery pe 20 minute phone chalaaya.", "Never have I ever stretched a 1% battery for 20 minutes.", "mild"),
        nhie_item("nhie-dd-026", ["social"], "Maine kisi ki story screenshot lete waqt haath kaampte dekhe.", "Never have I ever taken a screenshot with shaky hands.", "spicy"),
        nhie_item("nhie-dd-027", ["chat"], "Maine message padh ke notification se hi ignore kiya.", "Never have I ever read a text from preview and ignored it.", "mild"),
        nhie_item("nhie-dd-028", ["social"], "Maine kisi ko galti se video call lagaya aur instant kaata.", "Never have I ever butt-dialed a video call and panicked.", "spicy"),
        nhie_item("nhie-dd-029", ["internet"], "Maine internet band hone par router ko thappad maara.", "Never have I ever physically hit a router to fix Wi-Fi.", "mild"),
        nhie_item("nhie-dd-030", ["social"], "Maine reel share karke pucha 'bhai ye dekha kya?'.", "Never have I ever sent a reel and immediately asked about it.", "mild")
    ]

    cc = [
        nhie_item("nhie-cc-001", ["college"], "Maine roadmap save kiya par actual padhai shuru nahi ki.", "Never have I ever saved a roadmap instead of studying.", "mild"),
        nhie_item("nhie-cc-002", ["career"], "Maine ek tutorial dekh ke resume pe framework likh diya.", "Never have I ever added a skill to my resume after 1 video.", "spicy"),
        nhie_item("nhie-cc-003", ["project"], "Maine project ko 'done' bola jab main feature gayab tha.", "Never have I ever called a project done when incomplete.", "spicy"),
        nhie_item("nhie-cc-004", ["study"], "Maine padhai se bachne ke liye productivity videos dekhe.", "Never have I ever watched productivity vids to avoid study.", "mild"),
        nhie_item("nhie-cc-005", ["coding"], "Maine coding question padha aur turant solution copy kiya.", "Never have I ever opened a code problem and copied solution.", "mild"),
        nhie_item("nhie-cc-006", ["college"], "Maine group project join kiya jismein koi kaam nahi karta tha.", "Never have I ever joined a group project that did zero work.", "mild"),
        nhie_item("nhie-cc-007", ["study"], "Maine 'kal se pakka padhunga' bol ke time waste kiya.", "Never have I ever said 'I'll study tomorrow' and wasted it.", "mild"),
        nhie_item("nhie-cc-008", ["AI"], "Maine AI se homework karwaya aur viva mein fas gaya.", "Never have I ever used AI for work and blanked in viva.", "spicy"),
        nhie_item("nhie-cc-009", ["study"], "Maine timetable banaya jo agle din lunch se pehle fail hua.", "Never have I ever made a study timetable that failed fast.", "mild"),
        nhie_item("nhie-cc-010", ["project"], "Maine presentation mein bug ko feature bol ke cover kiya.", "Never have I ever pitched a code bug as an intentional feature.", "mild"),
        nhie_item("nhie-cc-011", ["attendance"], "Maine attendance bachane ke liye proxy lagwayi.", "Never have I ever had a friend call a proxy attendance for me.", "spicy"),
        nhie_item("nhie-cc-012", ["viva"], "Maine viva mein sir ko confident smile deke confuse kiya.", "Never have I ever smiled confidently in viva with zero answers.", "mild"),
        nhie_item("nhie-cc-013", ["exams"], "Maine exam hall mein formula rubber pe likha.", "Never have I ever written formulas on an eraser.", "spicy"),
        nhie_item("nhie-cc-014", ["college"], "Maine lab manual dost se subah 8 baje copy kiya.", "Never have I ever copied a lab record at 8 AM before class.", "mild"),
        nhie_item("nhie-cc-015", ["career"], "Maine placement test mein calculator chhupa ke use kiya.", "Never have I ever secretly used a calculator in aptitude tests.", "mild"),
        nhie_item("nhie-cc-016", ["bunk"], "Maine 8:30 AM wali class ke alarm ko dismiss karke so gaya.", "Never have I ever dismissed an 8:30 AM alarm and slept in.", "mild"),
        nhie_item("nhie-cc-017", ["career"], "Maine LinkedIn pe kisi stranger se referral bheekh maangi.", "Never have I ever begged a random stranger on LinkedIn for a job.", "mild"),
        nhie_item("nhie-cc-018", ["college"], "Maine college fest ke naam par 4 din class bunk ki.", "Never have I ever bunked 4 straight days under fest duty guise.", "mild"),
        nhie_item("nhie-cc-019", ["study"], "Maine exam se 2 ghante pehle YouTube 1-shot video dekha.", "Never have I ever watched a 1-shot revision video 2 hrs before.", "mild"),
        nhie_item("nhie-cc-020", ["canteen"], "Maine canteen wale bhaiya ka khata mahino tak pending rakha.", "Never have I ever delayed paying my canteen balance for months.", "mild"),
        nhie_item("nhie-cc-021", ["tech"], "Maine GitHub pe green dots ke liye blank commit push kiya.", "Never have I ever pushed empty commits just for green dots.", "mild"),
        nhie_item("nhie-cc-022", ["college"], "Maine class bunk karke library ke AC mein neend li.", "Never have I ever slept peacefully in the AC library.", "mild"),
        nhie_item("nhie-cc-023", ["exams"], "Maine exam sheet mein extra marks ke liye emotional note likha.", "Never have I ever written an emotional note to pass exams.", "spicy"),
        nhie_item("nhie-cc-024", ["career"], "Maine interview mein bola 'I work too hard' weakness ke naam pe.", "Never have I ever claimed 'working too hard' as my weakness.", "mild"),
        nhie_item("nhie-cc-025", ["college"], "Maine group project PPT presentation ke waqt pehli baar dekhi.", "Never have I ever seen the group project PPT on demo stage.", "spicy"),
        nhie_item("nhie-cc-026", ["coding"], "Maine stackoverflow ka pura block bina samjhe paste kiya.", "Never have I ever pasted code from StackOverflow without reading.", "mild"),
        nhie_item("nhie-cc-027", ["college"], "Maine teacher ko email kiya 'Sir attachment bhool gaya tha'.", "Never have I ever emailed 'Sorry forgot attachment' to buy time.", "mild"),
        nhie_item("nhie-cc-028", ["attendance"], "Maine 74% attendance dekh ke HOD ke pair pakde.", "Never have I ever begged faculty over a 74% attendance shortfall.", "spicy"),
        nhie_item("nhie-cc-029", ["career"], "Maine online free certificate download karke kabhi course nahi kiya.", "Never have I ever downloaded course certificate without doing it.", "mild"),
        nhie_item("nhie-cc-030", ["college"], "Maine mass bunk todne wale topper ko galiya di.", "Never have I ever cursed the topper who broke our mass bunk.", "spicy")
    ]

    hf = [
        nhie_item("nhie-hf-001", ["hostel"], "Maine kettle mein Maggi banake room mein party ki.", "Never have I ever made kettle Maggi for a late-night feast.", "mild"),
        nhie_item("nhie-hf-002", ["family"], "Maine parents ko 'padhai chal rahi hai' bol ke movie dekhi.", "Never have I ever told parents I was studying while at movies.", "mild"),
        nhie_item("nhie-hf-003", ["hostel"], "Maine roommate ka shampoo bina bataye pura khatam kiya.", "Never have I ever secretly used up my roommate's shampoo.", "spicy"),
        nhie_item("nhie-hf-004", ["hostel"], "Maine hostel curfew ke baad boundary wall jump ki.", "Never have I ever jumped the hostel wall after curfew hours.", "spicy"),
        nhie_item("nhie-hf-005", ["family"], "Maine college fee ke bahaane parents se extra paise maange.", "Never have I ever asked parents for extra money on fake fees.", "spicy"),
        nhie_item("nhie-hf-006", ["hostel"], "Maine mess ki daal mein aalu dhoondne mein 10 min lagaye.", "Never have I ever searched 10 minutes for potato in mess dal.", "mild"),
        nhie_item("nhie-hf-007", ["hostel"], "Maine iron box se bread toast banaya hostel room mein.", "Never have I ever made toast with a clothes iron in hostel.", "mild"),
        nhie_item("nhie-hf-008", ["hostel"], "Maine thandi mein 4 din bina nahaye college gaya.", "Never have I ever skipped bathing for 4 days in winter.", "unhinged"),
        nhie_item("nhie-hf-009", ["family"], "Maine result aane par gharwalon ko marks chupaye.", "Never have I ever concealed my semester grades from parents.", "spicy"),
        nhie_item("nhie-hf-010", ["hostel"], "Maine corridor mein cricket khelte hue bulb toda.", "Never have I ever broken a hallway light playing night cricket.", "mild"),
        nhie_item("nhie-hf-011", ["hostel"], "Maine warden aane par kettle ko rajai mein chupaya.", "Never have I ever hidden an electric kettle under my mattress.", "spicy"),
        nhie_item("nhie-hf-012", ["hostel"], "Maine roommate ke ghar se aaye snacks akele kha liye.", "Never have I ever finished a roommate's homemade sweets alone.", "spicy"),
        nhie_item("nhie-hf-013", ["family"], "Maine phone ka balance khatam hone ka bahana banaya.", "Never have I ever faked zero phone balance to avoid talking.", "mild"),
        nhie_item("nhie-hf-014", ["hostel"], "Maine geyser ke garam paani ke liye subah 5 baje bucket rakhi.", "Never have I ever placed a bucket at 5 AM for hot water.", "mild"),
        nhie_item("nhie-hf-015", ["hostel"], "Maine bina dhoye kapde ulte karke dubara pehane.", "Never have I ever worn dirty clothes inside-out to class.", "mild"),
        nhie_item("nhie-hf-016", ["hostel"], "Maine hostel Wi-Fi band hone par poore wing mein shor machaya.", "Never have I ever yelled across the floor when Wi-Fi crashed.", "mild"),
        nhie_item("nhie-hf-017", ["family"], "Maine relative ke 'beta package kitna hai' par jhooth bola.", "Never have I ever inflated my salary when asked by relatives.", "spicy"),
        nhie_item("nhie-hf-018", ["hostel"], "Maine dost ke birthday bumps mein poora badla liya.", "Never have I ever taken personal revenge during birthday bumps.", "spicy"),
        nhie_item("nhie-hf-019", ["hostel"], "Maine hostel mess se extra dessert chori karke pocket mein rakha.", "Never have I ever pocketed extra desserts from the mess hall.", "mild"),
        nhie_item("nhie-hf-020", ["hostel"], "Maine roommate ke phone ka hotspot bina bataye use kiya.", "Never have I ever drained a roommate's hotspot without asking.", "spicy"),
        nhie_item("nhie-hf-021", ["family"], "Maine parent-teacher meeting mein dost ko senior banaya.", "Never have I ever passed a friend as my guardian in meeting.", "unhinged"),
        nhie_item("nhie-hf-022", ["hostel"], "Maine raat ke 3 baje tapri pe jaake chai pee.", "Never have I ever snuck out for 3 AM campus chai.", "mild"),
        nhie_item("nhie-hf-023", ["hostel"], "Maine dhobi se galti se doosre ka hoodie collect kiya.", "Never have I ever kept someone else's hoodie from the laundry.", "spicy"),
        nhie_item("nhie-hf-024", ["family"], "Maine ghar jaake pehle din hi wapas hostel aane ka socha.", "Never have I ever wanted to escape home on day 1 of vacation.", "mild"),
        nhie_item("nhie-hf-025", ["hostel"], "Maine room lock ka code poore wing mein leak kar diya.", "Never have I ever leaked our room lock code to the whole floor.", "spicy"),
        nhie_item("nhie-hf-026", ["hostel"], "Maine mess secretary ke khane par boycott announce kiya.", "Never have I ever led a boycott against the mess lunch.", "mild"),
        nhie_item("nhie-hf-027", ["family"], "Maine call pe speaker on tha aur dost ne gaali dedi.", "Never have I ever had a friend curse while family was on call.", "spicy"),
        nhie_item("nhie-hf-028", ["hostel"], "Maine hostel bed sheet 3 mahine tak nahi dhoyi.", "Never have I ever gone 3 months without washing my bed sheet.", "unhinged"),
        nhie_item("nhie-hf-029", ["hostel"], "Maine light cut hone par corridor mein bartan bajaye.", "Never have I ever banged steel plates during a hostel blackout.", "mild"),
        nhie_item("nhie-hf-030", ["family"], "Maine gharpe bola 'attendance mandatory hai' vacation skip karne.", "Never have I ever faked mandatory classes to avoid visiting.", "spicy")
    ]

    ep = [
        nhie_item("nhie-ep-001", ["exams"], "Maine exam hall mein answer match karne par panic kiya.", "Never have I ever panicked finding different answers in hall.", "mild"),
        nhie_item("nhie-ep-002", ["placement"], "Maine mass recruiter company ka test bina prepare kare diya.", "Never have I ever sat for a campus placement with zero prep.", "mild"),
        nhie_item("nhie-ep-003", ["exams"], "Maine numerical exam mein answer sheet pe unit galat likhi.", "Never have I ever lost 10 marks writing wrong physics units.", "mild"),
        nhie_item("nhie-ep-004", ["placement"], "Maine interview mein company ke baare mein kuch nahi padha tha.", "Never have I ever entered an interview without reading the JD.", "spicy"),
        nhie_item("nhie-ep-005", ["exams"], "Maine internal exam mein fail hoke re-test diya.", "Never have I ever failed an internal test and begged re-exam.", "spicy"),
        nhie_item("nhie-ep-006", ["exams"], "Maine question paper ulta dekh ke pehli baar darr mehsoos kiya.", "Never have I ever turned an exam sheet over and felt pure dread.", "mild"),
        nhie_item("nhie-ep-007", ["placement"], "Maine aptitude round mein saare option C mark kar diye.", "Never have I ever blind-guessed Option C on an aptitude test.", "mild"),
        nhie_item("nhie-ep-008", ["exams"], "Maine exam khatam hone ke 5 min pehle 2 page bhare.", "Never have I ever written 2 full pages in the final 5 minutes.", "mild"),
        nhie_item("nhie-ep-009", ["placement"], "Maine GD (Group Discussion) mein doosre ka point repeat kiya.", "Never have I ever echoed another candidate's point in GD.", "mild"),
        nhie_item("nhie-ep-010", ["exams"], "Maine invigilator ko distract karne ke liye water bottle girayi.", "Never have I ever dropped a bottle to distract the invigilator.", "spicy"),
        nhie_item("nhie-ep-011", ["placement"], "Maine offer letter milne par dosto ko party dene se bacha.", "Never have I ever dodged buying a placement treat for weeks.", "mild"),
        nhie_item("nhie-ep-012", ["exams"], "Maine supply exam dene ke liye form last day bhara.", "Never have I ever paid backlog exam fees on the last hour.", "spicy"),
        nhie_item("nhie-ep-013", ["exams"], "Maine exam se 10 min pehle syllabus pehli baar dekha.", "Never have I ever discovered the syllabus 10 mins before exam.", "spicy"),
        nhie_item("nhie-ep-014", ["placement"], "Maine 3 LPA bond dekh ke application back out kiya.", "Never have I ever backed out of a placement due to service bonds.", "mild"),
        nhie_item("nhie-ep-015", ["exams"], "Maine topper se bola 'bhai mera paper check karwa de'.", "Never have I ever begged the topper to review my scratch notes.", "mild"),
        nhie_item("nhie-ep-016", ["placement"], "Maine HR round mein family background pe sympathy maangi.", "Never have I ever fished for sympathy in an HR interview.", "spicy"),
        nhie_item("nhie-ep-017", ["exams"], "Maine descriptive answer mein song lyrics fit kiye.", "Never have I ever embedded Bollywood lyrics in a theory answer.", "unhinged"),
        nhie_item("nhie-ep-018", ["placement"], "Maine placement cell head se arguments kiye shortlist pe.", "Never have I ever argued with placement officers over lists.", "spicy"),
        nhie_item("nhie-ep-019", ["exams"], "Maine hall ticket print karwana bhool gaya exam morning.", "Never have I ever forgotten to print my exam admit card.", "spicy"),
        nhie_item("nhie-ep-020", ["placement"], "Maine formal suit dost se borrow karke interview diya.", "Never have I ever borrowed a friend's oversized formal suit.", "mild"),
        nhie_item("nhie-ep-021", ["exams"], "Maine calculator memory mein formulas save karke rakhe.", "Never have I ever stored cheat formulas in calculator memory.", "spicy"),
        nhie_item("nhie-ep-022", ["placement"], "Maine interview call mein mute dabana bhool gaya aur shor hua.", "Never have I ever had loud background noise on an unmuted interview.", "spicy"),
        nhie_item("nhie-ep-023", ["exams"], "Maine re-evaluation ke liye 1000 rupaye deke marks kam karwaye.", "Never have I ever paid for revaluation only to score lower.", "spicy"),
        nhie_item("nhie-ep-024", ["placement"], "Maine mock interview mein pehle hi sawal pe fumble kiya.", "Never have I ever completely choked on Question 1 in mock interview.", "mild"),
        nhie_item("nhie-ep-025", ["exams"], "Maine dost ke paper se diagram bina samjhe copy kiya.", "Never have I ever copied a diagram from across the aisle blindly.", "mild"),
        nhie_item("nhie-ep-026", ["placement"], "Maine resume mein fake CGPA enter kiya online portal pe.", "Never have I ever inflated my CGPA by 0.5 on an online form.", "unhinged"),
        nhie_item("nhie-ep-027", ["exams"], "Maine exam hall mein invigilator ko pencil mangne ka drama kiya.", "Never have I ever faked asking for a pencil to whisper answers.", "mild"),
        nhie_item("nhie-ep-028", ["placement"], "Maine rejection mail dekh ke email account close kar diya.", "Never have I ever rage-closed my laptop after a rejection email.", "mild"),
        nhie_item("nhie-ep-029", ["exams"], "Maine exam ke baad dosto se marks discuss karke dukh manaya.", "Never have I ever ruined my day comparing answers after exam.", "mild"),
        nhie_item("nhie-ep-030", ["placement"], "Maine placement day pe mandir jaake prasad chadhaya.", "Never have I ever visited a temple exclusively for placement luck.", "mild")
    ]

    return [
        {"id": "digital-delusions", "name": "Digital Delusions", "level": "mild", "items": dd},
        {"id": "college-and-career", "name": "College & Career", "level": "mild", "items": cc},
        {"id": "hostel-and-family", "name": "Hostel & Family", "level": "spicy", "items": hf},
        {"id": "exams-and-placement", "name": "Exams & Placement", "level": "spicy", "items": ep}
    ]
