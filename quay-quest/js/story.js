// Story scripts: cutscenes, quest beats, customers, feds, endings.
(function () {
  'use strict';
  const QQ = window.QQ;
  const say = (who, text) => QQ.say(who, text);
  const flag = (k, v) => QQ.flag(k, v);
  const quest = (q) => { QQ.G.quest = q; QQ.toast('New objective (see Quest in the menu)', 'y'); };
  const tell = (text) => QQ.say(null, text);
  const boss = async (group, bg, intro) => {
    QQ.saveGame(true);
    const r = await QQ.battle.start(group, { bg, noFlee: true, intro });
    if (r !== 'win') await S.wipe();
    return r === 'win';
  };

  const S = QQ.story = {
    // ------------------------------------------------------------ opening
    async intro() {
      QQ.fadeA = 1;
      QQ.world.setMap('ends', 24, 9, [0, 1]);
      await tell([
        'South London. Crestwell Estate. ^yThe Ends^w.',
        'For sixty years the estate has been home. Loud, skint, and ours.',
        'Then ^rPulon Wrong^w turned up. Billionaire. Developer. He is buying the whole quadrant to build flats for artsy bellends.',
        'Only Aunty Pat\'s Community Initiative is holding the council back. The day the estate looks like the crime-ridden mess the papers say it is, the council signs. And that is that.'
      ]);
      await QQ.fade(0, 30);
      await say('kaz', 'Three wings and chips. Bossman knows the order.');
      await say('biggz', 'Kaz. Unc has been ringing off the hook. Says it is urgent. Says bring your big coat.');
      await say('kaz', 'Big coat? In June? ...He is sending man cunch, isn\'t he.');
      await say('biggz', 'Marlowe House, west side of the estate. Come, let\'s see what he wants.');
      QQ.toast('Find Unc in Marlowe House', 'y');
      QQ.saveGame(true);
    },

    async unc() {
      const G = QQ.G;
      if (G.quest === 'start') {
        await say('unc', ['Kaz. Biggz. Sit down. Do not touch the remote.',
          'The Ends is dead for business. Wrong has cameras on every lamp post and drones over the park. One bad headline and the council hands him the estate.',
          'So you are going ^ycunch^w. Up north. Town called ^yGrimsworth^w. Post-industrial. Which is a posh way of saying there is nothing there but a Griggs and regret.']);
        await say('kaz', 'And we stay where?');
        await say('unc', '14 Bleak Street. Fella called Gaz. Likes his food. Keep him fed and he keeps his door open. That is the arrangement.');
        await say('biggz', 'That is kind of dark, Unc.');
        await say('unc', ['It is county lines, Biggz, not Countryfile.',
          'Here. Burner phone. Four Bud on tick. Twenty quid for the train. Sell to the cats up there, they pay near double.',
          'And listen. Do NOT shot on the estate. Do NOT scrap on the estate. Aunty Pat\'s lot are all that is keeping the bulldozers out. Go see her at the community centre before you leave.']);
        QQ.give('burner'); G.stash.bud += 4; QQ.addP(20);
        quest('station');
        return;
      }
      await say('unc', QQ.pick(['Talk to me.', 'You look tired. The North will do that.', 'Make it quick, Bargain Hunt is on.']));
      for (;;) {
        const c = await QQ.choose(['Re-up', 'What now?', 'Kip here', 'Leave']);
        if (c === 0) await QQ.menus.buyProduct(false);
        else if (c === 1) await say('unc', S.hint());
        else if (c === 2) await S.rest();
        else return;
      }
    },
    hint() {
      const q = QQ.G.quest;
      return {
        station: 'Train station is the north-east corner of the estate. Buy a ticket to Grimsworth off the machine.',
        gaz: '14 Bleak Street. South end of Grimsworth. Red door.',
        shed: 'Gaz says there is a what in his shed?',
        library: 'A library. In Grimsworth. I am as surprised as you are.',
        baz: 'Mad Baz runs the Rusty Ferret. He does not do refunds.',
        dreg: 'Dregthorpe-on-Sea. Take a coat. Take two.',
        kev: 'Find a way into Kev\'s back office. Your cousin Shay works that pier, last I heard.',
        pid: 'Lower Piddlebrook. They will smell London on you. Keep your head down.',
        lady: 'Get in that manor. Buy your way in or go round the back through the farm.',
        quay: 'Blackwater Quay. This is it, Kaz.', container: 'Berth 4. Do not let him put that thing on.'
      }[q] || 'Keep your head down and your P up.';
    },
    async rest() {
      const c = await QQ.choose(['Kip till morning', 'Not yet'], { title: 'Heals all. A day passes.' });
      if (c !== 0) return;
      await QQ.fade(1, 20);
      QQ.healAll(); QQ.nextDay(1); QQ.audio.sfx('heal');
      await QQ.wait(30);
      QQ.saveGame(true);
      await QQ.fade(0, 20);
    },

    async tarquin() {
      if (QQ.G.quest === 'start') {
        await say('agent', 'Excuse me! This walkway is reserved for prospective buyers of The Crestwell Collection. Studios from six-fifty.');
        await say('kaz', 'It is a train station, bruv.');
        await say('agent', 'It is a transport-adjacent lifestyle opportunity.');
        return;
      }
      await say('agent', 'Before you go: have you considered shared ownership? You would own a full eight percent of a cupboard.');
      await say('biggz', 'He is not moving, Kaz.');
      await tell('^yBATTLE BASICS^w  Attack is free. Skills cost NRG. Guard halves the next hit. Food heals. Scrapping on the estate normally costs community trust. This one is on the house.');
      const r = await QQ.battle.start(['b_agent'], { bg: 'ends', noFlee: true, intro: 'Tarquin from Sales blocks the way!' });
      if (r !== 'win') { await S.wipe(); return; }
      flag('tarquin', 1);
      await say('agent', 'I shall be leaving a VERY negative review.');
    },

    async pat() {
      const G = QQ.G;
      if (!flag('pat_met')) {
        flag('pat_met', 1);
        await say('pat', ['Do not you "wagwan Aunty" me, Kaz. I have known you since you were in nappies.',
          'You know what that Wrong man wants? "The Crestwell Collection". Nine hundred flats and a shop that only sells candles.',
          'The Community Initiative is the only thing in his way. The petition, the youth club, the food bank. While this estate looks after its own, the council cannot sign us away.',
          'But trust is thin, and his lobbyists are at it every single day. If you have got P, put it in the tin. If you have got trouble, take it elsewhere.']);
      } else await say('pat', G.trust <= 25 ? 'People are giving up, Kaz. I can feel it. We need help and we need it now.' : 'Still standing, baby. Still standing.');
      for (;;) {
        const c = await QQ.choose([{ label: 'Donate ' + QQ.money(50), disabled: G.p < 50 }, { label: 'Donate ' + QQ.money(200), disabled: G.p < 200 }, 'Anything need doing?', 'Bye']);
        if (c === 0 || c === 1) {
          const amt = c ? 200 : 50;
          QQ.addP(-amt, true); QQ.trust(c ? 22 : 5); G.donated += amt; QQ.audio.sfx('cash');
          await say('pat', QQ.pick(['Bless you. That is the food bank sorted till Thursday.', 'Every pound is a brick they cannot knock down.', 'Your mum would be proud. Do not tell her where it came from.']));
          if (G.donated >= 300 && !flag('pat_gift')) { flag('pat_gift', 1); await say('pat', 'Found this down the back of the collection tin. You have it.'); QQ.give('scratchcard'); }
        } else if (c === 2) {
          if (!flag('q_scones')) {
            if (QQ.count('scone') >= 3) {
              QQ.take('scone', 3); flag('q_scones', 1); QQ.trust(10);
              await say('pat', 'PROPER scones. Jam first, like civilised people. The bake sale is saved. Here, take my megaphone, I have a spare for marches.');
              QQ.give('megaphone');
            } else await say('pat', 'The bake sale. I need three proper cream scones. Not supermarket. PROPER. They do them out in the countryside somewhere.');
          } else if (!flag('q_trophy')) {
            if (QQ.count('trophy')) {
              QQ.take('trophy', 1); flag('q_trophy', 1); QQ.trust(10);
              await say('pat', 'A trophy! For the cabinet! The kids will lose their minds. Take these, the gym lot donated them.');
              QQ.give('proteinbar', 2);
            } else await say('pat', 'The youth club cabinet is empty. A trophy, ANY trophy, would mean the world to those kids. I hear seaside arcades give them out.');
          } else await say('pat', 'You have done plenty. Just keep the estate quiet and the tin full.');
        } else return;
      }
    },
    async salesSuite() {
      await say('henchman', ['Welcome to the Crestwell Collection marketing suite. Appointment only.',
        'Mr Wrong sees real potential in this community. Mostly once it has been removed.']);
    },

    // ------------------------------------------------------------ arrivals
    async arrive(town) {
      const G = QQ.G, k = 'arr_' + town;
      if (flag(k)) return;
      flag(k, 1);
      if (town === 'grim') {
        await say('biggz', 'So this is the North. Why is it so... grey?');
        await say('kaz', 'Bleak Street. Number 14. Red door. Come.');
        if (G.quest === 'station') quest('gaz');
      } else if (town === 'dreg') {
        await say('kaz', 'Smell that, Biggz? Sea air.');
        await say('biggz', 'That is chip fat.');
        if (QQ.inParty('gaz')) await say('gaz', 'Dregthorpe! Me nan brought us here in ninety-four. I were sick on the waltzers.');
        if (G.quest === 'dreg') quest('kev');
      } else if (town === 'pid') {
        if (QQ.inParty('gaz')) await say('gaz', 'Too clean, this. Makes us itchy.');
        if (QQ.inParty('shay')) await say('shay', 'Every car here costs more than my block.');
        await say('kaz', 'Piddlebrook Manor. East side of the village. Heads down.');
        if (G.quest === 'pid') quest('lady');
      } else if (town === 'quay') {
        await say('kaz', 'Berth 4. Container WR-0N6. Tonight.');
        await say('biggz', 'Stock up first, yeah? There is a bloke with a van over there.');
        if (G.quest === 'quay') quest('container');
      }
    },

    // ------------------------------------------------------------ Grimsworth
    async meetGaz() {
      if (flag('gaz_met')) return true;
      await say('kaz', '*knock knock*');
      await say('gaz', 'Who is it? If it is the telly licence, I have not got a telly. Do NOT look through the window.');
      await say('kaz', 'Unc sent us.');
      await say('gaz', '...Oh. OH. The London lads. Come in, come in. Wipe your feet. Actually don\'t, it will only make the floor dirtier.');
      await QQ.world.goto('gaz_house', 4, 5, [0, -1]);
      await say('gaz', 'Sofa is yours. Kettle is broke. Do not open the second cupboard, there is a situation.');
      await say('kaz', 'Here is the deal, Gaz. We work out of here. You stay fed. Nobody knocks on this door but us.');
      await say('gaz', 'Aye. That is... aye. Fair enough. Been a while since anyone wanted to stop at mine. Even if you are extorting us.');
      await say('biggz', 'We are not ext-');
      await say('kaz', 'We are a little bit extorting him, Biggz.');
      QQ.shakeT = 20; QQ.audio.sfx('crit');
      await tell('*CLANG*  Something falls over in the back garden.');
      await say('gaz', 'Oh, do not mind that. That is just the Sage. He lives in me shed.');
      await say('kaz', 'Your WHAT lives in your WHERE?');
      flag('gaz_met', 1); flag('trap', 1);
      await tell('^yThe trap house is yours.^w The bed heals everyone (a day passes). The phone on the table orders a re-up from Unc.');
      quest('shed');
      return false;
    },
    async gazHome() {
      await say('gaz', QQ.G.quest === 'shed' ? 'Shed is out the front, left of the house. Through the gate. Knock first, he gets startled.' : 'Mind the carpet. It is load-bearing.');
    },
    async shed() {
      if (!flag('gaz_met')) { await tell('A shed. It is padlocked from the inside, somehow.'); return; }
      await QQ.world.goto('shed', 3, 5, [0, -1]);
      if (!flag('sage_met')) await S.sageIntro();
    },
    async sageIntro() {
      QQ.audio.sfx('mystic');
      await say('sage', ['Close the door. You are letting the damp out.',
        'I am the ^yNitty Sage^w. Forty winters in this shed. I have seen things, lad. Mostly the inside of this shed.',
        'But I have READ. Grimsworth has one library. The government forgot to close it. And in its one history book there is a legend.',
        '^yTHE NITTY AMULET.^w An off-white stone, set upon a foundation of intricate copper. Older than the book. Older than the mill. Older than Griggs.',
        'Whoever wears it gains power beyond their wildest dreams. Every door opens. Every deal closes. But the stone takes its price from the purity of the soul. You get everything. You stop being anyone.']);
      await say('kaz', 'Sounds like a mad ting. What has it got to do with us?');
      await say('sage', 'It has been SEEN again. And a man is hunting it. A rich man. He buys streets the way you buy chicken.');
      await say('biggz', 'Pulon Wrong.');
      await say('sage', ['If he wears it, no petition on earth will stop him. Your estate. This town. Every town. All of it, flats.',
        'The amulet must be found and DESTROYED before it falls into the Wrong hands.', '...Yes. I heard it. Moving on.',
        'The trail starts in the library. Reference section. It is one book. You cannot miss it.']);
      await say('gaz', 'I am coming an\' all.');
      await say('kaz', 'You what?');
      await say('gaz', 'It is my shed. He is my sage. And I know every cat in every town from here to the coast. You need us.');
      QQ.join('gaz', Math.max(2, QQ.leadLv()));
      QQ.audio.sfx('levelup');
      await tell('^yGaz joined the party!^w He heals, he begs, and nobody knows what is in the carrier bag.');
      await say('sage', 'Take these. Thick-skin plasters. Do not ask what they have been through.');
      QQ.give('plaster');
      await tell('^yTRAPPING^w  Cats with a speech bubble want to buy. Every town pays best for something different: Grimsworth pays big for Light and Dark. Selling raises ^oheat^w.');
      flag('sage_met', 1);
      quest('library');
    },
    async sage() {
      const G = QQ.G;
      if (!flag('sage_met')) { await S.sageIntro(); return; }
      if (flag('baz') && !flag('sage_g1')) { flag('sage_g1', 1); await say('sage', 'You faced the landlord. Good. Wear this. It has been in the shed nearly as long as I have.'); QQ.give('medallion'); }
      if (flag('kev') && !flag('sage_g2')) { flag('sage_g2', 1); await say('sage', 'The seaside ledger. The trail warms. Luck favours the persistent, lad.'); QQ.give('scratchcard'); }
      if (flag('lady') && !flag('sage_g3')) { flag('sage_g3', 1); await say('sage', 'The quay, then. Drink these before you go. All of you. They are mostly vitamins.'); QQ.give('tonic', 2); }
      for (;;) {
        const c = await QQ.choose(['Guidance', 'Sage\'s brew', 'The legend', 'Leave']);
        if (c === 0) await say('sage', {
          library: 'The library, lad. North side of the high street. Stone building. Still open, against all odds.',
          baz: 'The Rusty Ferret. East end of the market. Its landlord tears pages from books. A man who would do that would do anything.',
          dreg: 'The seaside calls. The train will take you.', kev: 'An admiral who has never been to sea. His office holds the ledger.',
          pid: 'Follow the ledger west, to where the hedges are taller than the people.', lady: 'The manor. Front gate or back hedge. Both have their guardians.',
          quay: 'It ships tonight. Go. GO.', container: 'When it lies before you, remember: destroyed. Not kept. Not sold. Not worn.'
        }[G.quest] || 'The stone finds those who want too much. Want less.');
        else if (c === 1) {
          if (flag('brew') === G.day) await say('sage', 'One brew a day. More than that and you start seeing the shed for what it is.');
          else { flag('brew', G.day); QQ.healAll(); QQ.audio.sfx('heal'); await say('sage', 'Nettle, dandelion, and one sachet of Lemsip. Drink.'); QQ.toast('Party fully restored', 'g'); QQ.saveGame(true); }
        } else if (c === 2) await say('sage', 'An off-white stone on intricate copper. Power beyond your wildest dreams, paid for with the purity of your soul. It must be destroyed. I do not make the rules. I just live in the shed.');
        else return;
      }
    },
    async librarian() {
      if (QQ.has('librarycard')) { await say('librarian', 'Reference section is on the right. It is the book. Please do not lick the pages, we have had incidents.'); return; }
      await say('librarian', ['Shhh.', '...Sorry. Habit. Nobody has been in since March.',
        'The reference section is members only. A library card is forty pounds. Budget cuts. The card machine IS the budget.']);
      const c = await QQ.choose([{ label: 'Pay ' + QQ.money(40), disabled: QQ.G.p < 40 }, 'Leave it']);
      if (c !== 0) { if (QQ.G.p < 40) await say('gaz', 'Forty quid? Go shift that Bud first. There is cats all over town.'); return; }
      QQ.addP(-40, true); QQ.give('librarycard');
      await say('librarian', 'Welcome to Grimsworth Public Library. You are member number six.');
    },
    async book() {
      if (!QQ.has('librarycard')) { await say('librarian', 'Members only, please! The desk. Forty pounds.'); return; }
      await tell(['"A Compleat Hiftory of the Northern Counties, 1911."  It is chained to the desk.',
        '"...the Nitty Amulet, an off-white stone upon copper, passed from mill-owner to gambler to nitty and back again..."',
        '"...and its last known keeper did" -  the next page has been torn out.',
        'A beer mat is stuck in as a bookmark: "Property of B. Bazzington. The Rusty Ferret. HANDS OFF."']);
      if (QQ.G.quest === 'library') {
        await say('gaz', 'Mad Baz. Landlord of the Ferret. Does "asset recovery" for some developer on the side.');
        await say('kaz', 'Three guesses which developer.');
        quest('baz');
      }
    },
    async baz() {
      if (QQ.G.quest !== 'baz') { await say('baz', 'We are closed.'); await say('kaz', 'There are six people in here.'); await say('baz', 'Closed to YOU.'); return; }
      await say('baz', 'We are closed.');
      await say('kaz', 'You tore a page out of a library book, Baz.');
      await say('baz', ['Mr Wrong pays good money for old paper. Paid for that page, he did. Well. He will. Once I have had a read.', 'Tell you what. A grand, and it is yours.']);
      if ((await QQ.choose(['Scrap for it', 'Not yet'])) !== 0) return;
      if (!(await boss(['b_baz', 'hardman', 'hardman'], 'indoor', 'Mad Baz vaults the bar!'))) return;
      flag('baz', 1);
      await say('baz', 'Alright! ALRIGHT! Take it. It is only a page. Says the thing got pawned at the seaside. Could not read the rest, I had had nine pints.');
      QQ.give('tornpage'); QQ.trust(12); flag('town_dreg', 1);
      await tell('^yDregthorpe-on-Sea^w is now on the departure board.');
      quest('dreg');
    },

    // ------------------------------------------------------------ Dregthorpe
    async shay() {
      await say('shay', 'Kaz?! What is my little cousin doing in Dregthorpe?');
      await say('kaz', 'Shay? Thought you were doing a business degree.');
      await say('shay', 'I AM doing business. Contactless. On the pier. It is a growth sector.');
      await say('kaz', 'We need to get into Admiral Kev\'s back office.');
      await say('shay', 'Then you need a VIP card. I can clone one in ten seconds. But I cannot work, because that THING keeps nicking my card reader.');
      await tell('A seagull the size of a labrador lands on the railing. It has dead eyes and a tiny ponytail.');
      await say('shay', 'Steven. He runs this pier.');
      if (!(await boss(['b_gull', 'seagull', 'seagull'], 'sea', 'Steven Seagull is under siege!'))) return;
      await say('shay', 'Right. One VIP card, fresh out the oven. And I am coming with. Me and Kev have history. He banned me from the 2p machines.');
      QQ.join('shay', Math.max(5, QQ.leadLv() - 1));
      QQ.audio.sfx('levelup');
      await tell('^yShay joined the party!^w Fast, light-fingered, and banned from four branches of Argos.');
      QQ.give('vipcard'); flag('vip', 1);
    },
    async bouncer() {
      await say({ n: 'Bouncer', s: 'guard' }, 'VIPs only, pal. Admiral\'s orders.');
      if (!flag('arr_hint_shay')) { flag('arr_hint_shay', 1); if (QQ.inParty('gaz')) await say('gaz', 'Your cousin works that pier, dun\'t she? Far end, past the deckchairs.'); }
    },
    async kev() {
      await say('kev', 'Well, well. Shayanne. I told you: banned for life from the coin pushers.');
      await say('shay', 'It is Shay. And we are not here for 2ps.');
      await say('kaz', '1987. Somebody pawned an off-white amulet here. For a tenner and a bag of chips.');
      await say('kev', ['...Who told you about that? That ledger is worth a fortune now. There is a gentleman in London offering six figures for one line of it.',
        'And you lot want it for free. In MY Fun Palace. Lads: power up the machines.']);
      if (!(await boss(['b_kev', 'bandit', 'bandit'], 'arcade', 'Admiral Kev mans the Penny Cannon!'))) return;
      flag('kev', 1);
      await say('kev', 'Take it! Take the ledger! Just stop hitting the machines, they are on finance!');
      QQ.give('ledger'); QQ.trust(12); flag('town_pid', 1);
      await tell(['"1994. One amulet, off-white. Sold to Lady A. Hedgefund of Piddlebrook Manor, for her collection of curiosities."',
        '^yLower Piddlebrook^w is now on the departure board.']);
      quest('pid');
    },
    async dance() {
      if (QQ.count('trophy') || flag('q_trophy')) { await tell('DANCE DANCE EVOLUTION. Your initials are already on the high score board: KAZ.'); return; }
      const c = await QQ.choose([{ label: 'Play (' + QQ.money(15) + ')', disabled: QQ.G.p < 15 }, 'Nah'], { title: 'Dance machine' });
      if (c !== 0) return;
      QQ.addP(-15, true);
      await tell('Biggz steps up. The machine creaks. The crowd gathers.');
      if (Math.random() < 0.55) { QQ.audio.sfx('levelup'); await tell('HIGH SCORE! The machine prints a prize voucher.'); QQ.give('trophy'); }
      else { QQ.audio.sfx('no'); await say('biggz', 'It is rigged. I was on beat. You saw me. I was on beat.'); }
    },

    // ------------------------------------------------------------ Piddlebrook
    async gateButler() {
      if (QQ.has('invite')) { flag('pid_gate', 1); await say('butler', 'Very good, sir. Do try not to touch anything. Or anyone.'); return; }
      await say('butler', 'The garden party is by invitation only, sir. Might I suggest the tradesman\'s entrance. It is in another county.');
      if (QQ.inParty('shay')) await say('shay', 'Either we buy an invite off that woman with the clipboard, or we go round the back through the farm.');
    },
    async pippa() {
      if (QQ.has('invite')) { await say({ n: 'Pippa', s: 'officeworker' }, 'Do have a super time!'); return; }
      await say({ n: 'Pippa', s: 'officeworker' }, 'Charity gala tickets! All proceeds go to... well. To the gala. Three hundred and twenty pounds.');
      const c = await QQ.choose([{ label: 'Buy (' + QQ.money(320) + ')', disabled: QQ.G.p < 320 }, 'No thanks']);
      if (c === 0) { QQ.addP(-320, true); QQ.give('invite'); await say({ n: 'Pippa', s: 'officeworker' }, 'Super! Dress code is "smart rural". Oh. Well. Never mind.'); }
    },
    async combine() {
      await say({ n: 'Farmer Giles', s: 'farmer' }, 'That hedge is PRIVATE. This field is PRIVATE. And this here combine cost more than your house.');
      if ((await QQ.choose(['Go through him', 'Back off'])) !== 0) return;
      if (!(await boss(['b_tractor', 'farmer'], 'village', 'Farmer Giles fires up the combine!'))) return;
      flag('combine', 1);
      await say({ n: 'Farmer Giles', s: 'farmer' }, 'Twenty year I have guarded that gap. Go on, then. Mind the hydrangeas.');
    },
    async lady() {
      await say('lady', 'Jeeves, there appear to be youths in the ballroom.');
      await say('butler', 'Shall I fetch the hounds, m\'lady?');
      await say('kaz', 'Lady Hedgefund. 1994. You bought an amulet off a pawn counter in Dregthorpe.');
      await say('lady', ['The Nitty Amulet? Ghastly little thing. Sat in a drawer for thirty years. It made the staff... ambitious.',
        'I have just sold it, as it happens. To that charming Mr Wrong. He is turning the village allotments into a wellness retreat. We are partners.',
        'It ships from Blackwater Quay tonight. And YOU will not be there. Jeeves. The crop.']);
      if (!(await boss(['b_lady', 'jeeves', 'jeeves'], 'manor', 'Lady Hedgefund removes her gloves!'))) return;
      flag('lady', 1);
      await say('lady', 'Take the manifest. TAKE it. It hardly matters. He will be wearing it by midnight.');
      QQ.give('manifest'); QQ.give('ring'); QQ.trust(12); flag('town_quay', 1);
      await tell('^yBlackwater Quay^w is now on the departure board. There is no coming back from this one without a fight: stock up.');
      quest('quay');
    },

    // ------------------------------------------------------------ the quay
    async vanMan() {
      const who = { n: 'Van Man', s: 'shopkeeper2' };
      await say(who, 'All legit. Fell off a ferry, not a lorry. Totally different thing.');
      for (;;) {
        const opts = ['Browse'];
        if (!QQ.has('gatepass') && !flag('gate')) opts.push({ label: 'Gate pass (' + QQ.money(260) + ')', disabled: QQ.G.p < 260 });
        opts.push('Leave');
        const c = await QQ.choose(opts);
        if (c === 0) await QQ.menus.shop('van');
        else if (opts.length === 3 && c === 1) { QQ.addP(-260, true); QQ.give('gatepass'); await say(who, 'Laminated and everything. If anyone asks, your name is Keith.'); }
        else return;
      }
    },
    async captain() {
      await say('guard', 'Blackwater Quay. Authorised personnel only.');
      const opts = [];
      if (QQ.has('gatepass')) opts.push('Show the pass');
      opts.push('Force it', 'Leave');
      const c = await QQ.choose(opts);
      if (opts[c] === 'Show the pass') { flag('gate', 1); await say('guard', '...Go on then, Keith.'); return; }
      if (opts[c] !== 'Force it') return;
      if (!(await boss(['b_captain', 'guarddog', 'guarddog'], 'quay', 'The Gate Captain whistles for the dogs!'))) return;
      flag('gate', 1);
      await say('guard', 'I am not paid enough for this. Gate is open. I never saw you.');
    },
    async dozer() {
      await tell(['A bulldozer idles across the lane. Stencilled on the blade: "THE REGENERATOR 9000. Building Tomorrow\'s Communities, Today."', 'Its headlights swivel towards you.']);
      if ((await QQ.choose(['Take it on', 'Back away'])) !== 0) return;
      if (!(await boss(['b_dozer', 'drone', 'drone'], 'quay', 'The Regenerator 9000 lowers its blade!'))) return;
      flag('dozer', 1);
      await say('biggz', 'I just fought a building site. And WON.');
    },
    async finale() {
      await say('pulon', ['You must be Kaz. Do you know, your estate has cost me four years and eleven planning consultants?',
        'I do not hate the place. I simply see what it could be without the people in it.']);
      await say('kaz', 'It is not yours. And neither is that.');
      await say('pulon', ['This? I paid Lady Hedgefund two million for a pebble on a bit of copper. Do you know why?',
        'Because every obstacle I have ever faced was, in the end, a person. And this makes people... move.']);
      if (QQ.inParty('gaz')) await say('gaz', 'Do not put it on, pal. I have seen what wanting summat that bad does to a person.');
      await say('pulon', 'Gentlemen. Engage the stakeholders.');
      if (!(await boss(['b_pulon', 'associate', 'associate'], 'quay', 'Pulon Wrong loosens his tie!'))) return;
      await say('pulon', 'Fine. FINE. I did not want to do this before the photo call.');
      QQ.audio.sfx('mystic'); await QQ.flash(40);
      await tell(['He puts on the amulet.', 'The stone burns off-white. Something leaves his eyes.']);
      await say('pulon2', 'EVERY POSTCODE. EVERY STREET. PRIME. REAL. ESTATE.');
      QQ.healAll();
      await tell('A voice, from a shed two hundred miles away: "On your feet, lads."  (Party fully restored.)');
      const r = await QQ.battle.start(['b_pulon2'], { bg: 'quay', noFlee: true, intro: 'Pulon the Wrong \'Un towers over the quay!' });
      if (r !== 'win') { await S.wipe(); return; }
      flag('pulon', 1);
      await QQ.flash(30);
      await tell(['The chain snaps. The amulet skitters across the dock and stops at your feet.',
        'It is warm. It is humming. It knows your name. It knows exactly what you want.']);
      const c = await QQ.choose(['Destroy it', 'Put it on'], { cancel: false, title: 'The Nitty Amulet' });
      await S.ending(c === 0);
    },
    async ending(good) {
      const G = QQ.G;
      QQ.audio.music('ending');
      if (good) {
        await say('kaz', 'Biggz. Do the honours.');
        QQ.shakeT = 30; QQ.audio.sfx('crit'); await QQ.flash(40);
        await tell(['The stone cracks. For a second every light on the quay goes out.', 'Then it is just a pebble on a bit of copper.']);
        await say('pulon', '...Where am I? Why am I on a dock? I have a meeting about a candle shop.');
        await QQ.fade(1, 40);
        await tell(['Without the amulet, Wrong Developments PLC found its planning applications mysteriously unpersuasive.',
          'The council voted 9-0 to protect Crestwell Estate. Aunty Pat cried. Then denied it.',
          'Gaz got clean. He runs the Grimsworth branch of Wingz & Tingz now. The burger sauce is his own recipe.',
          'Shay finished her business degree. First class. Nobody asks how she paid the fees.',
          'Biggz opened a gym in the old sales suite. No candles.',
          'The Nitty Sage is still in the shed. He says it has good energy.',
          'And Kaz? Kaz put the P in the tin and went legit. Mostly.',
          '^yTHE END.^w  The real Nitty Amulet was the mandem we made along the way.',
          'Finished on day ' + G.day + ' with ' + G.trust + '% community trust and ' + QQ.money(G.p) + ' in the bag.']);
      } else {
        QQ.audio.sfx('mystic'); await QQ.flash(60);
        await tell(['It fits like it was made for you.', 'Every door opens. Every deal closes.']);
        await QQ.fade(1, 40);
        await tell(['Kaz Tower completed in 2029. Nine hundred flats and a shop that only sells candles.',
          'Aunty Pat\'s petition got four signatures.', 'You have everything. You are no longer anyone.',
          '^rTHE END?^w  The Sage did warn you. Load your save and choose again.']);
      }
      await tell(['^yQUAY QUEST: Legend of the Nitty Amulets^w',
        'Sprites: found with the Pixel Search space by cfahlgren1, from the CC0 dataset Angais/pixel-art-atlas-1.4m.',
        'A work of fiction and satire. Any resemblance to real estates, admirals or seagulls is coincidental. Big up the mandem.']);
      await S.toTitle();
    },
    async toTitle() {
      QQ.fadeA = 1;
      QQ.world.setMap('ends', 24, 9);
      QQ.fadeA = 0;
      // hand control back to the title flow once this script unwinds
      setTimeout(() => { QQ.busy = 0; QQ.script(QQ.menus.title); }, 0);
    },

    // ------------------------------------------------------------ recurring systems
    async customer(n, town, prods, lines) {
      const G = QQ.G, who = { n: n.name, s: n.s };
      if (G.sold[n.id] === G.day) { await say(who, lines[2] || 'Sorted for today, ta.'); return; }
      const w = QQ.customerWant(n.id, town, prods), P = QQ.PRODUCTS[w.prod];
      await say(who, lines[0] + ' Got any ^y' + P.name + '^w? I will take ' + w.qty + ' at ' + QQ.money(w.each) + ' a go.');
      if (!G.stash[w.prod]) { await say('kaz', 'Not on me. Come back to you.'); return; }
      const q = Math.min(w.qty, G.stash[w.prod]);
      if ((await QQ.choose(['Sell ' + q + ' for ' + QQ.money(q * w.each), 'Nah'])) !== 0) return;
      G.stash[w.prod] -= q; QQ.addP(q * w.each); G.sold[n.id] = G.day;
      QQ.addHeat(town, 9);
      await say(who, lines[1] || 'Nice one.');
      if (town === 'ends') { QQ.trust(-4); await say('biggz', 'Fam. Not on the estate. Aunty Pat will hear about that by teatime.'); }
    },
    async bulk(n, town, line) {
      await say({ n: n.name, s: n.s }, line);
      await QQ.menus.sellBulk(town);
    },
    async trapPhone() {
      if (!flag('trap')) return;
      await say('unc', '*crackle*  Yo. What you need? Delivery is twenty-five percent on top. Petrol is not free.');
      await QQ.menus.buyProduct(true);
    },
    async chest(m, x, y, key, loot, p) {
      if (flag(key)) { await tell('Empty.'); return; }
      flag(key, 1);
      m.o[m.i(x, y)] = 'chest_open';
      QQ.audio.sfx('door');
      for (const [item, n] of loot) QQ.give(item, n || 1);
      if (p) QQ.addP(p);
    },
    async feds(town) {
      const L = QQ.leadLv() + 1;
      QQ.ENEMIES.fed = QQ.mob(L, { name: 'Fed', sprite: 'police', hpx: 1.3, defx: 1.2, acts: [['baton', 3], ['cuff', 2]] });
      QQ.ENEMIES.fed2 = QQ.mob(L, { name: 'Fed', sprite: 'police2', hpx: 1.3, defx: 1.2, acts: [['baton', 3], ['cuff', 2]] });
      await say('fed', 'Evening, gents. This town has had a lot of complaints. Mind if we have a look in the bag?');
      const r = await QQ.battle.start(['fed', 'fed2'], { bg: QQ.world.map.bg, intro: 'Feds! It is on top!' });
      if (r === 'lose') {
        const lost = QQ.stashCount(), fine = Math.round(QQ.G.p * 0.3);
        QQ.G.stash = { bud: 0, light: 0, dark: 0 }; QQ.addP(-fine, true); QQ.G.heat[town] = 20;
        await QQ.fade(1, 20);
        QQ.healAll();
        await tell('Released under investigation. They kept the bag (' + lost + ' units) and ' + QQ.money(fine) + ' "for evidence".');
        const t = QQ.TOWNS[town]; QQ.world.setMap(t.map, t.at[0], t.at[1]);
        await QQ.fade(0, 20);
      } else if (r === 'win') { QQ.addHeat(town, 10); await say('biggz', 'That is going to come back on us. Lay low or leave town.'); }
      else await say('kaz', 'Too hot. Shift the rest somewhere else.');
    },
    async wipe() {
      const G = QQ.G, fine = Math.round(G.p * 0.2);
      await QQ.fade(1, 10);
      QQ.addP(-fine, true);
      G.party.forEach((id) => { G.chars[id].hp = Math.round(QQ.maxHp(id) * 0.6); G.chars[id].nrg = Math.round(QQ.maxNrg(id) * 0.6); });
      if (flag('trap')) QQ.world.setMap('gaz_house', 4, 4); else QQ.world.setMap('flat_unc', 4, 4);
      await tell('You wake up on a sofa. Everything hurts.' + (fine ? ' Somebody has been through your pockets: ' + QQ.money(fine) + ' gone.' : ''));
      await QQ.fade(0, 20);
    },
    async planningGranted() {
      flag('gameover', 1);
      QQ.audio.music(null); QQ.audio.sfx('lose');
      await QQ.fade(1, 40);
      await tell(['^rBREAKING^w  Council approves "The Crestwell Collection". "The estate had become a no-go area," says a spokesman for Wrong Developments.',
        'Aunty Pat\'s petition is filed under "noted".', 'The bulldozers arrive on Monday.',
        '^rGAME OVER.^w  The Ends needed looking after. Trust rises when you donate at the community centre and beat Wrong\'s people.']);
      const s = QQ.store.read();
      if (s) { s.trust = Math.max(s.trust, 18); if (s.flags) delete s.flags.gameover; QQ.store.write(s); }
      await S.toTitle();
    }
  };
})();
