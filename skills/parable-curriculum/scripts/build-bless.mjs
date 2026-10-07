// Builds lib/samples/bless.json: the B.L.E.S.S. series rewritten to follow the Parable Ministry Playbook.
// Same series and week ids as the first version, so an untouched copy can be replaced in place.
import { writeFileSync } from 'node:fs';

let n = 0;
const id = (p) => `bless-${p}-${++n}`;
const part = (title, type, minutes, f = {}) => ({ id: id('p'), title, type, minutes, ...f });
const section = (title, role, parts) => ({ id: id('s'), title, role, parts });
const supply = (name, qty, per) => ({ id: id('x'), name, qty, per });
const lines = (...xs) => xs.join('\n');
const paras = (...xs) => xs.join('\n\n');
const q = (...xs) => xs.map((x, i) => `${i + 1}. ${x}`).join('\n');
const bullets = (...xs) => xs.map((x) => `• ${x}`).join('\n');

const SERIES_ID = 'bless-series';
const START = '2026-10-04';
const addDays = (iso, d) => { const t = new Date(`${iso}T12:00:00`); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };

// ---------- Pieces every week shares ----------

// The same welcome rhythm every week (Playbook: belonging first; newcomers get a clear way in).
const welcome = (checkIn, extra = '') => part('Welcome', 'script', 4, {
  instructions: paras(
    'Same rhythm every week:',
    bullets(
      'At the door: greet every student by name. If you don\'t know a name yet, ask, and use it tonight.',
      'Newcomers: introduce each new student to a host student (chosen ahead of time) who sits with them, introduces them to their small group leader, and walks with them to group.',
      'Check-in: everyone answers one quick question with a word or a thumbs up, sideways, or down. Anyone can pass.',
    ),
  ),
  script: paras(
    'Welcome in! If this is your first time here, we\'re really glad you came. [Point out the host students.] These friends will hang out with you tonight so you\'re not on your own.',
    extra,
    'You don\'t have to leave anything at the door tonight. Bring your worries, your questions, your good news, all of it. God can handle every bit of it.',
    `Quick check-in: ${checkIn} [Take a few answers. Anyone can pass.]`,
  ).replace(/\n\n\n\n/g, '\n\n'),
});

// The playbook's study method, the same three moves every week.
const study = (read, sit, live) => part('Read It · Sit In It · Live It', 'discussion', 6, {
  instructions: 'Walk through the passage together with the same three moves every week. Take a few answers for each. There are no wrong answers to "Sit in it."',
  script: q(`Read it: ${read}`, `Sit in it: ${sit}`, `Live it: ${live}`),
});

// The series practice: the same short moment every week, one step bigger each time.
const threeNames = (step) => part('Practice: The Three Names', 'prayer', 3, {
  supplies: [supply('BLESS cards from week 1 (spare index cards for anyone new)', 1, 'person')],
  instructions: 'Same format every week. Have students take out their BLESS card with their three names. New students can write three names on a spare card now. Keep the room quiet and unhurried.',
  script: paras(
    'Take out your BLESS card. [Pause.] These are three people God has put in your life.',
    '[30 seconds of silence.] Just hold the card and pray for each name. You don\'t need fancy words. Their name is a prayer.',
    step,
  ),
});

const icebreaker = (text, supplies = []) => part('Icebreaker', 'discussion', 3, { script: text, supplies });
const prayer = (text) => part('Prayer', 'prayer', 5, { script: text });

// Leader notes the small group page prints with each week's questions.
const SG_NOTES = (specific) => lines(
  "• Affirm before adding your view, don't correct the first answer, never require anyone to talk, and bring the group back to the passage.",
  `• ${specific}`,
);

// ---------- The five weeks ----------

const weeks = [
  // ---------------- Week 1 ----------------
  {
    title: 'Begin With Prayer',
    scripture: 'Colossians 1:3–12',
    keyVerse: 'For this reason, since the day we heard about you, we have not stopped praying for you. (Colossians 1:9)',
    bigIdea: 'Before we try to reach people, we pray for them, and prayer is an ongoing conversation with a God who already loves them.',
    objectives: lines(
      'Name the people God has placed in their life using FRANCS',
      'Choose three people and pray for them together',
      'Describe prayer as an ongoing conversation with God, not a one-time wish list',
    ),
    sections: [
      section('Opening', 'large', [
        welcome('What\'s your phone battery at right now? [Students can hold up fingers: 1 for almost dead, 5 for full.]',
          'Tonight we start a new series called B.L.E.S.S. Five weeks, five simple ways to join what God is already doing in the people around you.'),
        part('Illustration: Dead Battery', 'script', 6, {
          supplies: [supply('Your phone, or a slide of a dead-battery icon', 1, 'total'), supply('A charger', 1, 'total')],
          instructions: 'Hold up your phone (or show the dead-battery icon). Have a short, real story ready about your phone dying at the worst time.',
          script: paras(
            'What\'s the worst possible moment for your phone to die? [Take answers: the middle of a game, when you need a ride, right before you send the text.]',
            '[Share your story in a minute or less.]',
            '[Hold up the charger.] When a phone dies, people will ask total strangers for a charger. We know a phone without power is just a very expensive rock.',
            'Following Jesus can work the same way. We try to be kind, to invite people, to be a light, and we wonder why we feel drained. Tonight is about the power source.',
          ),
        }),
        part('Transition', 'prayer', 2, {
          script: paras(
            '"Begin with prayer" is the B in BLESS, and it comes first for a reason. Everything else runs on it.',
            'Let\'s start the way we want to keep going. [Pray briefly, asking the Holy Spirit to teach the group through the passage and to meet anyone who is carrying something heavy tonight.]',
          ),
        }),
      ]),
      section('Scripture', 'large', [
        part('Background', 'script', 3, {
          script: paras(
            'Colossians is a letter. Paul wrote it from prison to a young church in Colossae, a small town in what is now Turkey. Paul had never even been there.',
            'The church started because one ordinary guy named Epaphras heard about Jesus, went home, and told his friends. Later in the letter Paul says Epaphras is "always wrestling in prayer" for them (4:12).',
            'In God\'s big story, God made people to be close to him and to each other. Sin broke that. Jesus came to put it back together, and this same letter says God is reconciling "all things" to himself through Jesus (1:20). Prayer is one way we join that work while we wait for everything to be made new.',
          ),
        }),
        part('Read: Colossians 1:3–12', 'bible-verse', 3, {
          instructions: 'Have your student reader read Colossians 1:3–12 aloud from a Bible or a Bible app. Everyone else can follow along on a phone or a printed copy.',
          leaderNotes: 'Student role: by midweek, ask a student to read the passage and send it to them so they can practice. Thank them by name afterward.',
        }),
        study(
          'Which words show up again and again? (Listen for "always," "all," "every," "continually," "growing.")',
          'Imagine you\'re one of the Colossians and you find out someone has been praying for you every single day, by name. How would that feel?',
          'What would change if you prayed for the same three people every day this month?',
        ),
      ]),
      section('Teaching', 'large', [
        part('Point 1: Prayer is a conversation, not a one-time wish list', 'script', 5, {
          script: paras(
            '[Ask first:] Has anyone ever prayed about something once and then completely forgot about it? [Take a few answers. Laugh with them; everybody has.]',
            'Look at the repetition: "We always thank God… when we pray" (v. 3). "We have not stopped praying for you" (v. 9). "We continually ask" (v. 9).',
            'Prayer isn\'t a vending machine where you put in a request and wait for the snack to drop. It\'s more like a group chat that stays open all day. You keep coming back to it because you\'re in a relationship with the person on the other end.',
            'That\'s what Christians believe prayer is: talking with Jesus, who already loves you and already loves the people you\'re praying for even more than you do.',
          ),
        }),
        part('Point 2: Prayer asks for growth, not just gifts', 'script', 5, {
          supplies: [supply('A small potted plant or seedling', 1, 'total'), supply('A gift card', 1, 'total')],
          script: paras(
            '[Hold up the gift card in one hand and the plant in the other.] If someone offered you one of these, which would you take? [Most will pick the gift card.]',
            'Paul doesn\'t pray for the Colossians to get stuff. He prays they\'d be "bearing fruit… growing in the knowledge of God" (v. 10). The gospel itself is "bearing fruit and growing throughout the whole world" (v. 6).',
            'A gift card is fun for a day. A plant keeps growing. When we pray for our friends, we\'re not just asking God to fix their week. We\'re asking God to grow something real in them: peace, hope, and knowing Jesus.',
          ),
        }),
        part('Point 3: Prayer is for everyone, and it gets to be honest', 'script', 5, {
          script: paras(
            'Paul talks about love for "all" God\'s people and asks for "all wisdom" and "all power." God can use anyone, from anywhere, to bless anyone.',
            'But let\'s be honest about the hard part. Maybe you\'ve prayed for someone for a long time and nothing seems to change. Remember Epaphras was "wrestling" in prayer. Wrestling is hard work. Sometimes prayer feels like that, and that\'s not a sign you\'re doing it wrong. People in the Bible felt that too.',
            '[Leader: in a minute or less, share about someone you prayed for over a long time, what it was like, and what you noticed God doing, even if the story isn\'t finished.]',
            'You don\'t need to have it together to pray. Jesus welcomes you exactly as you are tonight, with whatever words you have, or none at all.',
          ),
        }),
      ]),
      section('Application', 'large', [
        part('Mapping Your People (FRANCS)', 'group-activity', 8, {
          supplies: [supply('Pens', 1, 'person'), supply('Sheets of paper', 1, 'person'), supply('Index cards for BLESS cards', 1, 'person')],
          instructions: paras(
            'FRANCS helps students notice the people God has placed around them. Give everyone paper and a pen. Read each category and give a moment to write names:',
            lines(
              '• Friends: Who do you choose to spend time with?',
              '• Relatives: Who is in your family, near or far?',
              '• Acquaintances: Who do you cross paths with regularly?',
              '• Neighbors: Who lives near you?',
              '• Classmates: Who do you see in class, at lunch, on the bus, or at practice?',
              '• Strangers: Who do you pass often but have never really met?',
            ),
            'Then hand out an index card to each student. This is their BLESS card. Ask them to choose three names from their map and write them on the card. Suggest they keep it in a phone case, wallet, or planner. They\'ll use it every week.',
          ),
        }),
        threeNames('Now let\'s pray for them together for the first time. [Lead a one-sentence prayer: "God, these are people you love. Help them know you, and help me love them well." Then 30 more seconds of silence.]'),
        part('Weekly Challenge: Pray for Your Three Names', 'script', 2, {
          script: paras(
            'Here\'s an experiment for this week: pray for your three names once a day. Try this and notice what happens, in them and in you.',
            'It can take ten seconds. Set a daily reminder on your phone, or pray when you see the card. Next week we\'ll talk about what you noticed.',
          ),
        }),
      ]),
      section('Small Groups', 'small', [
        icebreaker('What\'s one thing that recharges you when you\'re running on empty?'),
        part('Discussion', 'discussion', 12, {
          script: q(
            'Has anyone ever told you they were praying for you? What was that like?',
            'In verses 9–12, what does Paul ask God for? I wonder why he prays for growth instead of an easy life.',
            'What makes prayer hard for you, or makes it hard to believe God is listening?',
            'Where did you see God this week? Where did God feel far away?',
            'Who are your three names? Share first names, why you chose them, or keep it private.',
          ),
          leaderNotes: SG_NOTES('If someone says prayer feels pointless, thank them for being honest, remember Epaphras "wrestling," and follow up this week.'),
        }),
        prayer('30 seconds of silence. Then teach a prayer students can use alone: hold your BLESS card and pray each name, "God, show (name) how much you love them." Close by thanking God that he hears every prayer, even the ones that feel stuck.'),
      ]),
    ],
  },

  // ---------------- Week 2 ----------------
  {
    title: 'Listen With Care',
    scripture: 'Acts 8:26–38',
    keyVerse: 'Then Philip began with that very passage of Scripture and told him the good news about Jesus. (Acts 8:35)',
    bigIdea: 'We listen to God and to people, notice where God is already working, and join Him.',
    objectives: lines(
      'Notice and follow the Holy Spirit\'s nudges',
      'Practice listening to understand before trying to fix',
      'See that Jesus goes looking for people who feel like outsiders',
    ),
    sections: [
      section('Opening', 'large', [
        welcome('One word for your week so far.'),
        part('Illustration: Back-to-Back Drawing', 'group-activity', 8, {
          supplies: [supply('Blank sheets of paper', 1, 'person'), supply('Pens', 1, 'person'), supply('Printed shape cards', 1, 'person')],
          instructions: paras(
            'The setup: Pair students up and have them sit back-to-back. Give Student A a blank sheet and a pen. Give Student B a card with an abstract shape on it (or a simple picture, like a house with a chimney and a tree). Groups of three are fine for anyone without a partner.',
            'The activity: Student B describes the picture without naming it. Student A draws but can\'t speak, only listen. 60 seconds. Then switch roles with a new card, and this time Student A may ask questions.',
            'Compare the drawings with the cards. Expect laughter. Celebrate the worst drawing as loudly as the best.',
          ),
          leaderNotes: 'Student role: ask a student ahead of time to help you demo the game up front.',
        }),
        part('Transition', 'script', 2, {
          script: paras(
            '[Ask:] Which round went better, the one where you couldn\'t ask questions or the one where you could? Why?',
            'Listening isn\'t just hearing words. It\'s a two-way connection. Without good questions, we usually end up with a mess. That\'s the L in BLESS: listen with care.',
          ),
        }),
      ]),
      section('Scripture', 'large', [
        part('Background', 'script', 3, {
          script: paras(
            'Acts is a history book written by Luke, the same person who wrote the Gospel of Luke. Luke tells about Jesus; Acts tells what the Holy Spirit did through Jesus\'s followers after he rose and returned to the Father.',
            'Jesus had said the good news would go "to the ends of the earth" (Acts 1:8). To people in Jerusalem, Ethiopia was the ends of the earth.',
            'In God\'s big story, God promised Abraham long ago that "all peoples on earth" would be blessed through his family (Genesis 12:3). Tonight we watch that promise reach one man on a desert road.',
          ),
        }),
        part('Read: Acts 8:26–38', 'bible-verse', 4, {
          leaderNotes: 'Student role: by midweek, ask a student to read the passage and send it to them to practice.',
          script: paras(
            'Now an angel of the Lord said to Philip, "Go south to the road—the desert road—that goes down from Jerusalem to Gaza." So he started out, and on his way he met an Ethiopian eunuch, an important official in charge of all the treasury of the Kandake (which means "queen of the Ethiopians"). This man had gone to Jerusalem to worship, and on his way home was sitting in his chariot reading the Book of Isaiah the prophet. The Spirit told Philip, "Go to that chariot and stay near it."',
            'Then Philip ran up to the chariot and heard the man reading Isaiah the prophet. "Do you understand what you are reading?" Philip asked.',
            '"How can I," he said, "unless someone explains it to me?" So he invited Philip to come up and sit with him.',
            'This is the passage of Scripture the eunuch was reading: "He was led like a sheep to the slaughter, and as a lamb before its shearer is silent, so he did not open his mouth. In his humiliation he was deprived of justice. Who can speak of his descendants? For his life was taken from the earth."',
            'The eunuch asked Philip, "Tell me, please, who is the prophet talking about, himself or someone else?" Then Philip began with that very passage of Scripture and told him the good news about Jesus. As they traveled along the road, they came to some water and the eunuch said, "Look, here is water. What can stand in the way of my being baptized?" And he gave orders to stop the chariot. Then both Philip and the eunuch went down into the water and Philip baptized him.',
          ),
        }),
        study(
          'Who does Philip listen to in this story? (The angel, the Spirit, the man, and the Scriptures.)',
          'Picture yourself as the man in the chariot, reading something you don\'t understand, far from home. What do you feel when a stranger runs up and asks a real question?',
          'Where is one place this week where you could ask a question instead of giving an answer?',
        ),
      ]),
      section('Teaching', 'large', [
        part('Point 1: Philip listened to the Spirit', 'script', 5, {
          script: paras(
            '[Ask first:] Have you ever had a random thought to text someone, and it turned out they really needed it? [Take an answer or two.]',
            'Philip got two nudges: "Go south to the desert road" (v. 26) and "Go to that chariot and stay near it" (v. 29). He didn\'t get the whole plan, just the next step. And he ran.',
            '[Leader: in a minute or less, share a time you sensed a nudge from God to talk to someone, and what happened, including if you ignored it.]',
            'We miss a lot because we\'re busy or our earbuds are in, literally and spiritually. Here\'s an easy practice: when you sit down for lunch, ask, "God, who do you want me to notice today?"',
          ),
        }),
        part('Point 2: Philip listened to the man before he talked', 'script', 5, {
          script: paras(
            'Philip\'s first words were a question: "Do you understand what you are reading?" He let the man lead.',
            'Think about how often someone says "I\'m fine" in the group chat, and we move on. Listening with care means paying attention to what\'s under the words: Are they tired, stressed, lonely, excited about something?',
            '[Quick practice: turn to the person next to you. One person answers "How was your week, really?" for 45 seconds. The other may only nod or ask questions, no advice. Then switch. Anyone can say "pass."]',
            'How did that feel? Most of us rarely get listened to like that. When you listen first, you\'re treating someone the way Jesus treats you.',
          ),
        }),
        part('Point 3: Jesus goes looking for outsiders', 'script', 5, {
          script: paras(
            'Here\'s something that\'s easy to miss. This man traveled hundreds of miles to worship God, and he couldn\'t fully get in. The law of that time kept eunuchs out of the inner courts of the temple (Deuteronomy 23:1). That\'s a hard part of this story, and it\'s okay to say it hurts to read.',
            'But a few chapters after the passage he was reading, Isaiah promises that eunuchs who love God will have "a name better than sons and daughters" in God\'s house (Isaiah 56:4–5). Then Philip "began with that very passage… and told him the good news about Jesus."',
            'Jesus sent someone running down a desert road for one outsider. Christians believe that Jesus, the lamb in Isaiah\'s words, gave his life so that nobody would be left outside. The man\'s question, "What can stand in the way?", has an answer: on Jesus\'s side, nothing. Whatever you\'re carrying tonight, Jesus welcomes you.',
          ),
        }),
      ]),
      section('Application', 'large', [
        threeNames('This week we add a step. After you pray, stay quiet for 30 more seconds and ask, "God, what do you want me to notice about them?" [30 seconds of silence.]'),
        part('Weekly Challenge: Ask and Listen', 'script', 3, {
          script: paras(
            'Here\'s the experiment: keep praying for your three names every day. Then ask one of them a real question this week, and listen to the answer without trying to fix anything.',
            'Some questions to try: "What\'s been the best part of your week?" "What are you looking forward to?" "What\'s been stressing you out?"',
            'Try it and notice what happens. Next week, come ready to share one thing you heard.',
          ),
        }),
      ]),
      section('Small Groups', 'small', [
        icebreaker('Who is the best listener you know? What do they do that makes you feel heard?'),
        part('Discussion', 'discussion', 12, {
          script: q(
            'Last week we started praying for three names. What did you notice, in them or in you?',
            'Philip listened to the Spirit, to the man, and to Scripture. Which is easiest for you? Which is hardest?',
            'I wonder why Isaiah\'s words about a lamb opened the door for this man. What do you think?',
            'What\'s hard to believe about God speaking to people today?',
            'Where did you see God this week? Where did God feel far away?',
          ),
          leaderNotes: SG_NOTES('Question 1 follows up last week\'s challenge. Celebrate small things, and make it normal if nothing seemed to happen.'),
        }),
        prayer('30 seconds of silence. Then teach a listening prayer students can use alone: "God, I\'m listening. Who do you want me to notice today?" Pray for anyone who feels like an outsider right now, that they would know Jesus came looking for them.'),
      ]),
    ],
  },

  // ---------------- Week 3 ----------------
  {
    title: 'Eat Together',
    scripture: 'Luke 5:27–32',
    keyVerse: 'It is not the healthy who need a doctor, but the sick. (Luke 5:31)',
    bigIdea: 'Jesus used meals to show people they belonged before they had it all together, and we get to do the same.',
    objectives: lines(
      'See how powerful a real invitation can be',
      'Notice who is left out and move toward them',
      'Practice being fully present with the people around them',
    ),
    sections: [
      section('Opening', 'large', [
        welcome('What did you eat for lunch today? [Thumbs up or down on how it was.]'),
        part('Illustration: This or That', 'game', 8, {
          instructions: paras(
            'The goal: find common ground through quick food choices. No supplies needed. Students who would rather not move can point instead.',
            'The activity: Make one side of the room Option A and the other Option B. Call out a pairing; students move to their side. Once they land, they have 30 seconds to find someone on their side, ideally someone they don\'t know well, and answer the follow-up question. Anyone can pass.',
            lines(
              '1. Tacos or Pizza? What\'s your favorite food from when you were little?',
              '2. Sweet or Salty? What\'s your go-to movie-night snack?',
              '3. Homemade or Fast Food? If you had to cook one meal for your friends, what would it be?',
              '4. Pancakes or Waffles? What\'s a food everyone likes but you don\'t?',
              '5. "Table for two" or "Party of eight"? Who would you most want to share a meal with?',
            ),
            'The point: food sets the table for connection, even with people you barely know.',
          ),
          leaderNotes: 'Student role: ask a student ahead of time to run this game from the front. Give them the list by midweek.',
        }),
        part('Transition', 'script', 2, {
          script: paras(
            '[Ask:] Why do you think God made food taste this good when he could have just given us fuel? What does that say about him?',
            'Tonight is the E in BLESS: eat together. Jesus took meals very seriously.',
          ),
        }),
      ]),
      section('Scripture', 'large', [
        part('Background', 'script', 3, {
          script: paras(
            'Luke is a Gospel, a true account of Jesus\'s life. In Jesus\'s time, tax collectors worked for Rome, the empire occupying Israel, and many cheated their own neighbors. They were treated like traitors. Nobody respectable would eat with them.',
            'In God\'s big story, God keeps setting tables: in the garden, at the Passover, at Jesus\'s meals, at the Last Supper, and at the end of the story there\'s a feast where people from everywhere eat with God (Revelation 19:9). Tonight\'s meal is a preview.',
          ),
        }),
        part('Read: Luke 5:27–32', 'bible-verse', 3, {
          leaderNotes: 'Student role: by midweek, ask a student to read the passage and send it to them to practice.',
          script: paras(
            '27 After this, Jesus went out and saw a tax collector by the name of Levi sitting at his tax booth. "Follow me," Jesus said to him, 28 and Levi got up, left everything and followed him.',
            '29 Then Levi held a great banquet for Jesus at his house, and a large crowd of tax collectors and others were eating with them. 30 But the Pharisees and the teachers of the law who belonged to their sect complained to his disciples, "Why do you eat and drink with tax collectors and sinners?"',
            '31 Jesus answered them, "It is not the healthy who need a doctor, but the sick. 32 I have not come to call the righteous, but sinners to repentance."',
          ),
        }),
        study(
          'What does Levi do right after Jesus invites him? Who shows up at his party?',
          'Imagine you\'re Levi, the person everyone avoids, and Jesus says "Follow me." What goes through your head?',
          'Who could you invite to sit with you, at lunch or anywhere, this week?',
        ),
      ]),
      section('Teaching', 'large', [
        part('Point 1: The invitation came first', 'script', 5, {
          script: paras(
            '[Ask first:] What does it feel like to see a story online of a hangout you weren\'t invited to? [Let a few answer. Name that it stings.]',
            'Jesus invited Levi before Levi cleaned up his life. "Follow me." That\'s it. Levi got up, left everything, and threw a party.',
            'Surveys keep finding that lots of teenagers feel lonely, even while always being online. So the person you\'re nervous to invite might be hoping someone asks. An invitation says, "You belong here," and that\'s exactly what Jesus says to us.',
          ),
        }),
        part('Point 2: Jesus sat at the table everyone avoided', 'script', 5, {
          script: paras(
            'The religious leaders complained: "Why do you eat with tax collectors and sinners?" Picture your school cafeteria. Which table would people be shocked to see Jesus sit at?',
            'Here\'s a confusing part. Jesus says he didn\'t come for "the healthy" or "the righteous." Is he saying some people don\'t need him? No. He\'s being a little ironic. Everybody needs the doctor. The only people the doctor can\'t help are the ones who think they\'re fine.',
            'Christians believe Jesus came for all of us, the messy and the ones who look like they have it together. That means you never have to earn a seat at his table.',
          ),
        }),
        part('Point 3: Presence over performance', 'script', 5, {
          script: paras(
            '[Physical moment: invite everyone to put their phone face down on the floor for the next minute. Notice how it feels.]',
            'Jesus didn\'t grab a snack and leave. He stayed at the party and met Levi\'s friends. Between school, practice, work, and scrolling, we rarely give anyone our full attention. A meal slows us down long enough for walls to come down.',
            '[Leader: in a minute or less, share a meal where someone made you feel like you belonged.]',
            'You can pick your phone back up. Remember: Jesus wants to be at the table with you, as you are, tonight.',
          ),
        }),
      ]),
      section('Application', 'large', [
        threeNames('Add this week\'s step: after you pray and listen, pick one of your three names and ask God, "How could I share a meal or a snack with them this week?" [30 seconds of silence.]'),
        part('Weekly Challenge: Share a Table', 'script', 3, {
          script: paras(
            'Keep praying for your three names every day. Then try this: share food with one of them this week. Lunch counts. A snack after practice counts. Splitting fries counts.',
            'Put your phone away while you eat, ask a question, and listen. Try it and notice what happens.',
          ),
        }),
      ]),
      section('Small Groups', 'small', [
        icebreaker('What\'s the best meal you\'ve ever had, and who were you with?', [supply('Snacks to share family-style (chips, fruit, cookies)', 1, 'group'), supply('Napkins', 1, 'group')]),
        part('Discussion', 'discussion', 12, {
          script: q(
            'Last week you asked someone a real question. What did you hear?',
            'Has someone ever invited you in when you felt like an outsider? What did it do for you?',
            'Why do you think Levi\'s first move was to throw a party for his friends?',
            'I wonder which table Jesus would sit at in our cafeteria. Why that one?',
            'What\'s hard to believe about Jesus wanting to eat with messy people, including you?',
            'Where did you see God this week? Where did God feel far away?',
          ),
          leaderNotes: SG_NOTES('Open the snacks and pass them around before the questions, so the group eats together while they talk (check for allergies). Some students rarely get family meals; keep the challenge simple and free.'),
        }),
        prayer('30 seconds of silence. Then teach a prayer students can pray before lunch: "Jesus, thank you for inviting me. Help me invite someone else." Pray for anyone who feels left out. Name that loneliness hurts, and thank Jesus that he sits with us in it.'),
      ]),
    ],
  },

  // ---------------- Week 4 ----------------
  {
    title: 'Serve With Love',
    scripture: 'Matthew 25:31–46',
    keyVerse: 'Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me. (Matthew 25:40)',
    bigIdea: 'Serving with love means being a real friend alongside someone, not treating them like a project to fix.',
    objectives: lines(
      'See that God values every person equally',
      'Recognize Jesus in the people the world overlooks',
      'Choose to serve with someone, not just for them',
    ),
    sections: [
      section('Opening', 'large', [
        welcome('High or low: what was the best part and the hardest part of your week? [One word each. Anyone can pass.]',
          'Last week\'s challenge was to share a table. Did anyone eat with someone new? [Take one or two quick stories.]'),
        part('Illustration: The Hidden Message', 'game', 9, {
          supplies: [
            supply('Boxes of standard playing cards', 1, 'group'),
            supply('Paper slips (2.5" × 0.75") with "winner" written in pencil', 1, 'group'),
            supply('Prize ($5 bill or gift card)', 1, 'total'),
          ],
          instructions: paras(
            'The setup: Write "winner" on a slip of paper and place it face-down at the bottom of each box of playing cards, under the cards. Prepare one box per group of 4–8.',
            'Give a prepared box to each group. Everyone in the group can search; nobody plays alone.',
          ),
          script: paras(
            'There\'s a hidden message in each of these boxes. When I say go, open the box and be the first group to find the message and read it out loud. You have 52 seconds. Ready? Set… GO!',
            '[Debrief] Where did everyone look first? Why? How did it feel when the cards didn\'t have the message? Where was it the whole time? [In the box everyone ignored.]',
          ),
        }),
      ]),
      section('Scripture', 'large', [
        part('Background', 'script', 3, {
          script: paras(
            'This is a parable, a story Jesus told to teach something true. It\'s the last story he tells in Matthew before he goes to the cross.',
            'In God\'s big story, the world won\'t stay broken forever. Jesus describes the very end, when the King returns and puts everything right. It turns out the new creation belongs to people who loved the way he loves.',
          ),
        }),
        part('Read: Matthew 25:31–46', 'bible-verse', 5, {
          leaderNotes: 'Student role: by midweek, ask two students to read the passage, one reading the King\'s words and one reading everything else. Send it to them to practice.',
          script: paras(
            '31 "When the Son of Man comes in his glory, and all the angels with him, he will sit on his glorious throne. 32 All the nations will be gathered before him, and he will separate the people one from another as a shepherd separates the sheep from the goats. 33 He will put the sheep on his right and the goats on his left.',
            '34 "Then the King will say to those on his right, \'Come, you who are blessed by my Father; take your inheritance, the kingdom prepared for you since the creation of the world. 35 For I was hungry and you gave me something to eat, I was thirsty and you gave me something to drink, I was a stranger and you invited me in, 36 I needed clothes and you clothed me, I was sick and you looked after me, I was in prison and you came to visit me.\'',
            '37 "Then the righteous will answer him, \'Lord, when did we see you hungry and feed you, or thirsty and give you something to drink? 38 When did we see you a stranger and invite you in, or needing clothes and clothe you? 39 When did we see you sick or in prison and go to visit you?\'',
            '40 "The King will reply, \'Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me.\'',
            '41 "Then he will say to those on his left, \'Depart from me, you who are cursed, into the eternal fire prepared for the devil and his angels. 42 For I was hungry and you gave me nothing to eat, I was thirsty and you gave me nothing to drink, 43 I was a stranger and you did not invite me in, I needed clothes and you did not clothe me, I was sick and in prison and you did not look after me.\'',
            '44 "They also will answer, \'Lord, when did we see you hungry or thirsty or a stranger or needing clothes or sick or in prison, and did not help you?\'',
            '45 "He will reply, \'Truly I tell you, whatever you did not do for one of the least of these, you did not do for me.\'',
            '46 "Then they will go away to eternal punishment, but the righteous to eternal life."',
          ),
        }),
        study(
          'Who does Jesus say he is in this story? (The King, and also the hungry, thirsty, stranger, sick, and prisoner.)',
          'Both groups are surprised. Imagine being told you met Jesus every time you sat with someone lonely. How would that change your week?',
          'Who is one person in your everyday life who is easy to overlook?',
        ),
      ]),
      section('Teaching', 'large', [
        part('Point 1: God\'s value is upside down', 'script', 5, {
          script: paras(
            '[Ask first:] In the game, why did everyone tear through the cards? [Because we assumed that\'s where the value was.]',
            'We do the same with people. We pay attention to the popular, the talented, the people who can do something for us. And we skip right past the box.',
            'Jesus says every person is made in God\'s image and loved by God equally: the kid who eats alone, the new student, the custodian, your grandparent in the care home.',
          ),
        }),
        part('Point 2: Jesus calls them family', 'script', 5, {
          script: paras(
            'Notice what Jesus calls the hungry and the stranger: "these brothers and sisters of mine." Not projects. Not "the less fortunate." Family. And he says, "You did it for me."',
            'Now the hard part. This passage ends with judgment, and it\'s heavy. Let\'s not skip it. Jesus takes how we treat people very seriously. But notice: neither group knew they were serving Jesus. The "sheep" weren\'t earning points. We aren\'t saved by serving; Christians believe we\'re saved by grace through Jesus. Serving is what that grace looks like when it gets into our hands and feet.',
            'If this passage makes you nervous, that\'s okay. Bring that to Jesus. He\'s the King in the story, and he\'s also the one who gave his life for us.',
          ),
        }),
        part('Point 3: With, not for', 'script', 5, {
          script: paras(
            'There\'s a difference between serving for someone and serving with them. "For" can be top-down: I have, you need, I help, I leave. "With" is side by side: I show up, I listen, I learn your name, I come back.',
            'Real love also asks why. Why is someone hungry, or always alone? Asking why helps us stand with people, not just hand things to them.',
            '[Leader: in a minute or less, share a time someone served alongside you, or a time you served "for" someone and learned something.]',
            'Jesus didn\'t serve us from a distance. He came to be with us. Wherever you are tonight, he\'s with you too.',
          ),
        }),
      ]),
      section('Application', 'large', [
        threeNames('Add this week\'s step: after you pray and listen, ask, "God, how could I be with one of them, not just do something for them?" [30 seconds of silence.]'),
        part('Weekly Challenge: Serve Alongside Someone', 'script', 4, {
          script: paras(
            'This week\'s experiment is a service challenge with real people.',
            'Notice: who in your hallway, bus, team, or neighborhood gets overlooked? Write their name on the back of your BLESS card.',
            'Be with them: do one thing alongside them as a friend. Sit with them, join something they care about, or help with what they\'re already doing. Learn their name and listen. Try it and notice what happens; next week we\'ll talk about it.',
          ),
          leaderNotes: 'If your group can, plan an optional group serve this week with a local partner your church already knows, where students work side by side with the people they serve. Follow your church\'s safety policy for any off-site event.',
        }),
      ]),
      section('Small Groups', 'small', [
        icebreaker('Who is someone who always shows up for you? What do they do?'),
        part('Discussion', 'discussion', 12, {
          script: q(
            'Last week\'s challenge was to share a table. What happened?',
            'Has anyone helped you in a way that made you feel small? How is a real friend different?',
            'Both groups in the story were surprised. I wonder what it would look like if our group treated the "last" as first. Who would be the VIPs?',
            'What\'s hard to understand or believe about the judgment at the end of this passage?',
            'Where did you see God this week? Where did God feel far away?',
            'Who could you be with this week, not just do something for?',
          ),
          leaderNotes: SG_NOTES('Question 4 can stir fear. Stay calm, name that it\'s heavy, and point to grace: the King in the story is the Jesus who died for us. Follow up one-on-one with anyone who seems shaken.'),
        }),
        prayer('30 seconds of silence. Then pray a lament based on Psalm 13: "How long, Lord? People are hungry, lonely, and hurting. But I trust in your unfailing love." Students can use this pattern alone: tell God what\'s wrong, then that you trust him. Thank Jesus that he is with the hurting, without promising every situation will be fixed.'),
      ]),
    ],
  },

  // ---------------- Week 5 ----------------
  {
    title: 'Share the Story',
    scripture: 'John 4:1–26, 39–42',
    keyVerse: 'We know that this man really is the Savior of the world. (John 4:42)',
    bigIdea: 'Jesus knows our whole story and still offers us living water, and our story can point others to His.',
    objectives: lines(
      'See how Jesus crossed lines to offer living water',
      'Practice sharing a short part of their story with the five-finger Story Tool',
      'Take one next step with Jesus, wherever they are',
    ),
    sections: [
      section('Opening', 'large', [
        welcome('What\'s a story you\'ve told so many times your friends could tell it for you?',
          'Last week\'s challenge was to serve alongside someone. We\'ll talk about that in small groups tonight.'),
        part('Illustration: One-Sentence Story', 'game', 7, {
          instructions: paras(
            'The setup: Form circles of 8–12. No supplies needed.',
            'The activity: The leader starts a story with one sentence (for example, "There once was a student who found a strange envelope at the bottom of their locker"). Each person adds exactly one sentence. Anyone can say "pass" and the story keeps going.',
            'The goal: Listen to the person before you so the story makes sense and wraps up by the last person. Play two rounds, then debrief: What made it work? What made it fall apart?',
          ),
        }),
        part('Transition', 'script', 2, {
          script: paras(
            'Every sentence only made sense if it connected to the one before it. Our lives are like that. We\'re all part of a bigger story, God\'s story.',
            'You may not feel like you have an amazing story. That\'s okay. Your story points to one that is. That\'s the last S in BLESS: share the story.',
          ),
          leaderNotes: 'This week runs longer than the others because of the Story Tool practice and the response time. Consider extending your gathering or trimming the game to one round.',
        }),
      ]),
      section('Scripture', 'large', [
        part('Background', 'script', 3, {
          script: paras(
            'John is a Gospel written so that people "may believe that Jesus is the Messiah" (John 20:31). In Jesus\'s day, Jews and Samaritans had hated each other for centuries. Most Jews took the long way around Samaria. And men didn\'t talk with women they didn\'t know in public.',
            'In God\'s big story, wells are where lives change: Abraham\'s servant, Jacob, and Moses all met someone at a well. Jesus offers "living water," which points all the way to the river of life in the new creation (Revelation 22:1).',
          ),
        }),
        part('Read: John 4:1–26, 39–42', 'bible-verse', 5, {
          leaderNotes: 'Student role: ask two students by midweek to read: one reads Jesus, one reads the woman, and you read the narration. Send them the passage to practice.',
          script: paras(
            'Now Jesus learned that the Pharisees had heard that he was gaining and baptizing more disciples than John— 2 although in fact it was not Jesus who baptized, but his disciples. 3 So he left Judea and went back once more to Galilee.',
            "4 Now he had to go through Samaria. 5 So he came to a town in Samaria called Sychar, near the plot of ground Jacob had given to his son Joseph. 6 Jacob's well was there, and Jesus, tired as he was from the journey, sat down by the well. It was about noon.",
            '7 When a Samaritan woman came to draw water, Jesus said to her, "Will you give me a drink?" 8 (His disciples had gone into the town to buy food.)',
            '9 The Samaritan woman said to him, "You are a Jew and I am a Samaritan woman. How can you ask me for a drink?" (For Jews do not associate with Samaritans.)',
            '10 Jesus answered her, "If you knew the gift of God and who it is that asks you for a drink, you would have asked him and he would have given you living water."',
            '11 "Sir," the woman said, "you have nothing to draw with and the well is deep. Where can you get this living water? 12 Are you greater than our father Jacob, who gave us the well and drank from it himself, as did also his sons and his livestock?"',
            '[Continue reading from a Bible through verse 26.]',
            '25 The woman said, "I know that Messiah" (called Christ) "is coming. When he comes, he will explain everything to us." 26 Then Jesus declared, "I, the one speaking to you—I am he."',
            '39 Many of the Samaritans from that town believed in him because of the woman\'s testimony, "He told me everything I ever did." 40 So when the Samaritans came to him, they urged him to stay with them, and he stayed two days. 41 And because of his words many more became believers.',
            '42 They said to the woman, "We no longer believe just because of what you said; now we have heard for ourselves, and we know that this man really is the Savior of the world."',
          ),
        }),
        study(
          'How many questions does the woman ask Jesus? How does he answer them?',
          'Imagine you\'re her: you come to the well at noon, alone, and a stranger who knows your whole life offers you a gift instead of a lecture. What do you feel?',
          'Who in your life might be waiting for someone to just start the conversation?',
        ),
      ]),
      section('Teaching', 'large', [
        part('Point 1: Jesus crossed the lines first', 'script', 5, {
          script: paras(
            '[Ask first:] At your school, who isn\'t "supposed" to talk to whom? [Take a few answers.]',
            'Jesus was tired and thirsty, and he started the conversation by asking her for something: "Will you give me a drink?" He crossed the lines of race, religion, and reputation, and he let her see that he needed something too.',
            'Sharing your faith doesn\'t start with a speech. It starts like this: noticing someone, crossing a line nobody else will, and asking a real question.',
          ),
        }),
        part('Point 2: Jesus knew her whole story and offered living water', 'script', 6, {
          supplies: [supply('A clear pitcher of water', 1, 'total'), supply('A clear cup', 1, 'total')],
          script: paras(
            '[Slowly pour water into the cup so everyone can hear it.] Everybody\'s thirsty for something: to be known, to be loved, to matter.',
            'Jesus tells her he knows she\'s had five husbands and is living with someone now. People often read this as if she was a scandal. But in her world, women usually couldn\'t choose divorce. She may have been widowed or abandoned again and again. Either way, Jesus names her real story without shaming her, and then he tells her who he is: "I, the one speaking to you—I am he."',
            'Here\'s what Christians believe: Jesus is the Messiah, the Savior of the world. He lived, died for our sins, and rose again, so that anyone can be forgiven and have new life with God that starts now and lasts forever. He knows your whole story too, the parts you\'re proud of and the parts you hide, and he still offers living water.',
          ),
        }),
        part('Point 3: Her story pointed to His', 'script', 5, {
          script: paras(
            'She ran back to the town she\'d been avoiding and said, "Come, see a man who told me everything I ever did." She didn\'t have every answer. She still had questions. She just told what happened and invited people to come and see.',
            'And it worked: "Many… believed in him because of the woman\'s testimony." Then they met Jesus for themselves (v. 42). Your job isn\'t to convince anyone. It\'s to point.',
            '[Leader: share your own story in about one minute, using the five fingers you\'re about to teach. Keep it short and honest.]',
          ),
          leaderNotes: 'Optional student role: ask a student ahead of time if they\'d like to share a one-minute story of where they have seen God. Never put a student on the spot.',
        }),
      ]),
      section('Application', 'large', [
        part('The Story Tool: Five Fingers', 'group-activity', 10, {
          instructions: paras(
            'Teach the Story Tool with your hand, one finger at a time. Have everyone hold up their hand and touch each finger as you go:',
            lines(
              '• Thumb, Affirm: Listen to their story and give it a thumbs up. "That sounds really hard."',
              '• Pointer, Connect: Point to your story. "I\'ve felt that too."',
              '• Middle, Exalt: Lift up God\'s story, the part that fits. "Jesus felt that kind of pain too, and he\'s with us in it."',
              '• Ring, Reveal: Share your before and after. "When I started talking to Jesus about it, I didn\'t feel so alone."',
              '• Pinky, Suggest: Offer one small next step and do it together. "Want to come to youth group with me?"',
            ),
            'Then pair up for practice. One student shares a made-up struggle (stress, a fight with a friend, feeling left out); the other practices the five fingers out loud. Two minutes each, then switch. Anyone can watch instead of practicing.',
          ),
        }),
        part('An Open Door', 'prayer', 5, {
          supplies: [supply('Response cards', 1, 'person'), supply('Pens', 1, 'person')],
          instructions: paras(
            'Hand out response cards with four boxes and a line for a name:',
            bullets(
              '☐ I want to start following Jesus.',
              '☐ I want to take a next step with Jesus.',
              '☐ I have questions. I\'d like to talk with a leader.',
              '☐ Not right now, and that\'s okay.',
            ),
            'Play quiet music. Give plenty of time. Collect every card, filled in or blank, so no one stands out.',
          ),
          script: paras(
            'Before we finish, I want to give you a chance to respond. There\'s no pressure, and nobody will see your card except the leaders.',
            'Maybe tonight you want to start following Jesus. You can tell him right where you\'re sitting: "Jesus, I believe you are who you say you are. I want to follow you. Thank you for knowing my whole story and loving me anyway." If you prayed that, check the first box, and we\'d love to celebrate with you and help you take a first step.',
            'Maybe you already follow Jesus and you want to take a next step: reading a Gospel, getting baptized, joining a small group. Check the second box.',
            'Maybe you have questions. That\'s good. People in the Bible did too. Check the third box, and a leader will reach out.',
            'And if it\'s not right now, that\'s okay too. Jesus welcomes you wherever you are, and the door stays open.',
          ),
          leaderNotes: 'Follow up on every card within a week, one-on-one, in a place where others can see you. If a card or conversation mentions abuse, self-harm, or that a student isn\'t safe, follow your church\'s safety policy and tell the youth pastor the same day. Never promise to keep it secret.',
        }),
        threeNames('Add this week\'s step: after you pray and listen, ask, "God, open a door for me to share part of my story with one of them." [30 seconds of silence.]'),
        part('Weekly Challenge: Point to Jesus', 'script', 3, {
          script: paras(
            'Keep praying for your three names every day; this practice doesn\'t end with the series.',
            'This week, try one of these with one of your three names: tell them you\'ve been praying for them and ask if there\'s anything they\'d like prayer for, or when the moment comes, share one finger of your story. Try it and notice what happens.',
          ),
        }),
      ]),
      section('Small Groups', 'small', [
        icebreaker('What\'s one thing about you most people here wouldn\'t guess?'),
        part('Discussion', 'discussion', 14, {
          script: q(
            'Last week you served alongside someone. What did you see and feel? What\'s broken there?',
            'What does our faith say about it, and what might God be calling you to do next?',
            'Why do you think the woman ran to tell the people she\'d been avoiding?',
            'I wonder what it was like for her to be fully known and not rejected. What would that be like for you?',
            'What questions do you or your friends still have about God, Jesus, or church?',
            'Where did you see God this week? Where did God feel far away?',
          ),
          leaderNotes: SG_NOTES('Questions 1–2 debrief last week\'s service challenge. Never bring up response cards in group; follow up one-on-one.'),
        }),
        prayer('30 seconds of silence. Then teach a prayer students can keep using: hold your BLESS card and pray, "Jesus, you know their whole story. Show them your love, and use my story to point to yours." Thank God for these five weeks.'),
      ]),
    ],
  },
];

// Four everyday moments for parents (Playbook: morning line, on the go + something together, dinner question parents answer too, bedtime).
const FAMILY = {
  'Begin With Prayer': {
    morning: 'Pray together before school: "God, fill us with the knowledge of your will today" (Colossians 1:9).',
    onTheGo: 'Your teen chose three people to pray for this week. In the car, ask if you can pray for one of them together, and pray for one person in your life too.',
    meal: 'Ask: Has anyone ever prayed for you in a way you remember? Parents, share yours too.',
    bedtime: 'Ask, "Where did you see God today?" and pray a short, simple prayer. A note for parents: if your teen says prayer feels pointless, listen first. Hard questions often mean faith is becoming their own.',
  },
  'Listen With Care': {
    morning: 'Pray together: "God, help us notice who you want us to notice today."',
    onTheGo: 'Philip asked a real question before he talked. Try it: ask each other a question on the drive, and the listener may only ask follow-ups, no advice.',
    meal: 'Ask: Who in your life makes you feel really heard? What do they do? Parents answer too.',
    bedtime: 'Ask, "Where did you see God today?" and pray for someone either of you listened to. A note for parents: listening first, without fixing, is one of the best gifts you can give your teen this week.',
  },
  'Eat Together': {
    morning: 'Read Luke 5:31 together: "It is not the healthy who need a doctor, but the sick."',
    onTheGo: 'Plan one meal this week to invite someone new to your table, a neighbor, a friend of your teen\'s, or someone who might be lonely, and plan it together.',
    meal: 'Ask: If Jesus walked into your school (or work) cafeteria, which table would surprise people? Parents answer too. Try it with phones away.',
    bedtime: 'Ask, "Where did you see God today?" and thank God that Jesus eats with messy people. A note for parents: if your teen talks about feeling left out, stay with the feeling before offering solutions.',
  },
  'Serve With Love': {
    morning: 'Pray together: "Jesus, help us see you in someone we would usually overlook today."',
    onTheGo: 'Your teen has a challenge to serve alongside someone. Find one way to serve together as a family this week: visit someone, help a neighbor, or volunteer side by side.',
    meal: 'Ask: Has anyone ever helped you in a way that made you feel small? What did a real friend do differently? Parents answer too.',
    bedtime: 'Ask, "Where did you see God today?" and pray for the person your teen wrote down. A note for parents: this week\'s passage is heavy. If questions about judgment come up, listen first and point to grace.',
  },
  'Share the Story': {
    morning: 'Read John 4:42 together: "We know that this man really is the Savior of the world."',
    onTheGo: 'Practice the five-finger Story Tool together: Affirm, Connect, Exalt, Reveal, Suggest. Parents, share one finger of your own story with Jesus.',
    meal: 'Ask: When did you first feel fully known and still loved? Parents answer first this time.',
    bedtime: 'Ask, "Where did you see God today?" and pray together for each other\'s three names. A note for parents: your teen may have responded tonight or may have questions. Ask gently, and listen first.',
  },
};

const ORIGINAL_STAMP = Date.UTC(2026, 8, 30);
const now = Date.UTC(2026, 9, 5);
const series = {
  id: SERIES_ID,
  title: 'B.L.E.S.S.',
  description: 'A 5-week series on five everyday practices for joining what God is already doing in the people around us: Begin with prayer, Listen with care, Eat together, Serve with love, and Share the story.',
  audience: 'Students',
  color: 'emerald',
  startDate: START,
  bigIdea: 'God uses the unlikely to accomplish the impossible, and He invites us to join in.',
  memoryVerse: 'I will bless you… and you will be a blessing. (Genesis 12:2)',
  leaderGuide: paras(
    'Thank you for leading B.L.E.S.S. Over five weeks, students learn five everyday practices for joining what God is already doing: Begin with prayer, Listen with care, Eat together, Serve with love, and Share the story. It all starts with God\'s promise to Abraham: "I will bless you… and you will be a blessing."',
    'One practice runs through every week. In week 1, each student writes three names on a BLESS card, and every week the group prays for those names together, adding one step at a time. Each week also uses the same study method: Read it, Sit in it, Live it.',
    'Being known matters more than being impressive. Pray for each student by name before you arrive. Listen more than you talk; "I don\'t know, I wonder too" is a faithful answer. Notice the student who is here but not included, and sit with them. When a student questions or doubts, stay calm, stay close, and follow up one-on-one. Some students need help seeing hope; others need someone to stay with them in the pain. Behavior can be a response to something hard, so respond calmly.',
    'If a student shares abuse, self-harm, or that they are not safe, follow the church\'s safety policy and tell the youth pastor the same day. Never promise to keep it secret.',
  ),
  runs: [],
  printRun: '',
  createdAt: ORIGINAL_STAMP,
  updatedAt: now,
};

const services = weeks.map((w, i) => ({
  family: FAMILY[w.title],
  id: `bless-week-${i + 1}`,
  seriesId: SERIES_ID,
  week: i + 1,
  date: addDays(START, 7 * i),
  audience: 'Students',
  startTime: '18:30',
  classSize: 20,
  groupCount: 3,
  checkedSupplies: [],
  createdAt: ORIGINAL_STAMP,
  updatedAt: now,
  ...w,
}));

const out = process.argv[2];
writeFileSync(out, JSON.stringify({ version: 1, series: [series], services, library: [] }, null, 2) + '\n');
const mins = services.map((s) => s.sections.flatMap((x) => x.parts).reduce((a, p) => a + p.minutes, 0));
console.log('wrote', out, 'minutes per week:', mins.join(', '));
