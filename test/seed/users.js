const config = require('../../config')

// user 5 will used to update pwd
const users = {
  size: 100,
  data:
   {
     'admin':
    {
      uid: 'admin',
      nick: 'admin',
      privilege: config.privilege.Root,
      pwd: config.deploy.adminInitPwd,
    },
     'primaryuser':
      {
        uid: 'primaryuser',
        nick: 'user',
        pwd: 'testtest',
      },
     'v6u(EYNmK!Ot7xr(O':
      {
        uid: 'v6u(EYNmK!Ot7xr(O',
        nick: 'sJJrZuAUC^njEAcDY7)',
        pwd: 'yovQZm',
      },
     '&f]SKYIxlD':
      {
        uid: '&f]SKYIxlD',
        nick: 'f9Wj)QbBv1VJMmCBJTB4',
        pwd: 'l3Idh0oxQqQ',
      },
     'z(J^CoEjynC)yMCUJ8':
      {
        uid: 'z(J^CoEjynC)yMCUJ8',
        nick: 'WUx^FeHe04OE2fV2',
        pwd: 'xj[uito4eUWrTL)Yc$p',
      },
     'P8p)68&oLd[&Pec2!k':
      {
        uid: 'P8p)68&oLd[&Pec2!k',
        nick: 'Gys]Yc3ME',
        pwd: 'oP]ZWwB3R@R',
      },
     'ndscUELCG#':
      {
        uid: 'ndscUELCG#',
        nick: 'wZWt8G*z',
        pwd: 'JaXQg#xa9#HS4w7SsCH',
      },
     'VUW3XomkbM$Ek': { uid: 'VUW3XomkbM$Ek', nick: '3@(cK2Ny!5L', pwd: '3c[g#@' },
     'ez3ekKs]SG':
      { uid: 'ez3ekKs]SG', nick: 'KhJ]8enuH5lxb&U%', pwd: 's4Ie$p' },
     '!ziT$hhUlkEry9(Bb':
      {
        uid: '!ziT$hhUlkEry9(Bb',
        nick: 'O*]OgjiXn',
        pwd: '(XEo#NfHfW9$D',
      },
     '1$V$Qoa^j':
      {
        uid: '1$V$Qoa^j',
        nick: 'DV!XV^YzdaAFVWwA0bN8',
        pwd: 'S9I9wH$5JJl',
      },
     'I9o]e(aanCwj':
      {
        uid: 'I9o]e(aanCwj',
        nick: 'B%&bE*NpvMpl5O',
        pwd: 'uD68Y0j(^W6O0gW6',
      },
     'pwDTb': { uid: 'pwDTb', nick: '$Hd49V1h)JV', pwd: ']r%x$' },
     ')7#AgL)nb(QdLB&1bmY]':
      {
        uid: ')7#AgL)nb(QdLB&1bmY]',
        nick: 'iFAJ*iWpeIG]!dwTn]K',
        pwd: 'e7idsH1KzBSf',
      },
     'Gq]Ep]2E&CZJ':
      {
        uid: 'Gq]Ep]2E&CZJ',
        nick: '$lfbbvX^b)NuJqDL',
        pwd: 'uciqs@xiERNH',
      },
     'ODZGxsiU': { uid: 'ODZGxsiU', nick: 'c(cUl0!', pwd: '!]5A6' },
     'RyRU!Zfede':
      { uid: 'RyRU!Zfede', nick: ']90mV3', pwd: '1$f]NY0%^K)y@B[aDea' },
     '&iVFId^MFrcicz&qz':
      {
        uid: '&iVFId^MFrcicz&qz',
        nick: 'A]8r&J)OEjB!j[Y',
        pwd: 'XlIdQr]CuMcf',
      },
     '4QZqK4hMR)NB':
      {
        uid: '4QZqK4hMR)NB',
        nick: 'SWz%nLSp9q#WJaX',
        pwd: 'Gx#uX1jz&#RAERVBn',
      },
     'Lk1^8HkL4Y]AnR^jx':
      {
        uid: 'Lk1^8HkL4Y]AnR^jx',
        nick: 'pk#rxixanqyg)xjl',
        pwd: 'NDK%N8',
      },
     'vS]WopwD':
      {
        uid: 'vS]WopwD',
        nick: 'HL3acxf%Z)sjPN',
        pwd: 'X@t1Dq3Jt0g)BGO*',
      },
     '27TZ4WN47n5*j73ng*EH':
      {
        uid: '27TZ4WN47n5*j73ng*EH',
        nick: '0iH%zq)lgrlzU2ehi',
        pwd: 'bodGGVMK#]6i^kPGa]&',
      },
     'ZkXr@#0o7':
      { uid: 'ZkXr@#0o7', nick: 'gXrFIAEYKi*6XK(7', pwd: '$]zKP&CXQ]' },
     'pH[0U1hnKSKRYNV':
      { uid: 'pH[0U1hnKSKRYNV', nick: 'adgGNF5c', pwd: 'Fn@2%UJl$l6' },
     ']fRi&oqGzXNt(ESh[m@k':
      {
        uid: ']fRi&oqGzXNt(ESh[m@k',
        nick: 'IvpQSd93]x',
        pwd: 'rztQhcYDSv',
      },
     'wR$xnJTc7hV64oeA':
      {
        uid: 'wR$xnJTc7hV64oeA',
        nick: 'nsasl9d',
        pwd: 'y*MtC1tGdut(a2l%F6',
      },
     'VonA2s(hGO!Oe':
      {
        uid: 'VonA2s(hGO!Oe',
        nick: 'QAAjv#EUvG*',
        pwd: 's@$tNU2h@t!Ir5oak',
      },
     '(oe7]vPUkdR[2MY':
      {
        uid: '(oe7]vPUkdR[2MY',
        nick: 'FD[7Nwv5W5GAnSqo^P[z',
        pwd: 'Wqnk9NV1HGJkSW',
      },
     'cS%@4y!xbJch][j':
      {
        uid: 'cS%@4y!xbJch][j',
        nick: 'lrP%oq^pOguBzH6axxaT',
        pwd: 'uFyvO]o3D%jpcPFvH@L',
      },
     'Xl8iW$9d)kS':
      {
        uid: 'Xl8iW$9d)kS',
        nick: 'oJEmDgQ',
        pwd: '2MKDcuhJ!57C&PBE4c%',
      },
     ')WUSySS&F7m':
      {
        uid: ')WUSySS&F7m',
        nick: 'r[5iSm8X)y8',
        pwd: 'D]KRHOC[KDi3i^K',
      },
     '&3shs]ph2M%hXOXvB':
      { uid: '&3shs]ph2M%hXOXvB', nick: 'a1ARTI]RLic3', pwd: 'yb0Qw' },
     'N&X!xK': { uid: 'N&X!xK', nick: 'IWnX#96MdK!NNP', pwd: '7bslyl' },
     '3tNO1]dUCu&':
      {
        uid: '3tNO1]dUCu&',
        nick: '[(We2^@CWIIqOMtulr',
        pwd: 'rarMTLzx',
      },
     '$ulSUnioI0C[$9azm4':
      {
        uid: '$ulSUnioI0C[$9azm4',
        nick: 'kWKR!7ZP7',
        pwd: 'VmLo9xBp@^%q@6',
      },
     'z5bk%': { uid: 'z5bk%', nick: 'XtqYkrJ^$', pwd: '&jhinXVB[mes%#' },
     'Z60SD27*#mm^(':
      { uid: 'Z60SD27*#mm^(', nick: 'pr%Fr', pwd: 'elYmsGaQE81j8' },
     'BIzvdSzauftUP6LVxLl':
      {
        uid: 'BIzvdSzauftUP6LVxLl',
        nick: 'EMhCqg@w&',
        pwd: '0)$2N)zS$J',
      },
     '#pi8AlWgMQD!':
      { uid: '#pi8AlWgMQD!', nick: '#3ogr', pwd: '2Q(BY]pU6iu3uE' },
     'Fk%L138NsB0':
      {
        uid: 'Fk%L138NsB0',
        nick: 'wXZ]l8&TrNEl#',
        pwd: '3^$dX^!JW1@Q',
      },
     'ilj@r922AwrvLC6@#':
      {
        uid: 'ilj@r922AwrvLC6@#',
        nick: 'w2qMNvWEG%%KFjyZbitd',
        pwd: 'B2X4]H',
      },
     '^cy(OU^Acj2(':
      {
        uid: '^cy(OU^Acj2(',
        nick: 'YEv@*3I',
        pwd: 'SFRUbSVQvb$Iv8Y*HYfv',
      },
     'HD3HdhR': { uid: 'HD3HdhR', nick: 'kKW)aO]lt', pwd: 'Ox&jpa!' },
     'HcK#E':
      {
        uid: 'HcK#E',
        nick: 'B*8PFW0DH4ulsZhwEzLI',
        pwd: '@R2RwT7[wGBx2g$',
      },
     'l%NdXQ!fpB!MEGmsI':
      {
        uid: 'l%NdXQ!fpB!MEGmsI',
        nick: 'MX*p)JES9kW&OLr*$3k',
        pwd: 'q#2mE)59$#RE',
      },
     'r^aXJv8HdNiS6E)1Siw':
      {
        uid: 'r^aXJv8HdNiS6E)1Siw',
        nick: 'kl5a*riH8Ry',
        pwd: ')aW1yIZCu4hH6G!',
      },
     'c4F*Ud': { uid: 'c4F*Ud', nick: 'N8Ri[IS', pwd: 'gY67]lNP%(LH7qD' },
     '42vVVPCZRMnO8':
      { uid: '42vVVPCZRMnO8', nick: 'M[zbQP%TIE', pwd: 'Al%%m3Nq&y' },
     ']htb[)A)vZsLh':
      {
        uid: ']htb[)A)vZsLh',
        nick: 'BpZQVVgwlBc[n',
        pwd: 'Z3ep]sIrFRT]nQV',
      },
     'PciFYNdm9ukF': { uid: 'PciFYNdm9ukF', nick: 'de20zNBPKufh', pwd: 'mU23y)' },
     'MeWYRVoX': { uid: 'MeWYRVoX', nick: 'e(xr*6H', pwd: 'HQt[JV' },
     'AkQyE1]ldtsaQgfF%VSg':
      {
        uid: 'AkQyE1]ldtsaQgfF%VSg',
        nick: 'BZ(%7*H(8',
        pwd: '*RATkdvXC',
      },
     '&sBxFDaVGm%K$q&': { uid: '&sBxFDaVGm%K$q&', nick: 'XX6wEsg', pwd: 'zQtQQ' },
     '#J2A5j[iCr': { uid: '#J2A5j[iCr', nick: 'd6)hdMg', pwd: 'WqjWz' },
     'jIVd32pF[@6u@Uz':
      {
        uid: 'jIVd32pF[@6u@Uz',
        nick: 'tKRQDxI]jt',
        pwd: '^qK8b8LPXEZ23$e',
      },
     'rD$(qYco$52bejK':
      {
        uid: 'rD$(qYco$52bejK',
        nick: '#Ik@VgQ!aHMJVwbc',
        pwd: 'qz5cC&0vLc#',
      },
     'BKhQ^UofRvcztLm4':
      {
        uid: 'BKhQ^UofRvcztLm4',
        nick: 'wu&p^tn%oGrXN00^)By',
        pwd: 'L7bjcJL[HfCYYByoN1V',
      },
     'Ftd7oAQu!':
      { uid: 'Ftd7oAQu!', nick: 'uMYRocyyggkbuL^P', pwd: 'U@v#IGu' },
     'o!yR#':
      { uid: 'o!yR#', nick: 'F661apGKj[l)LKj#', pwd: 'R(hwIaNt22UN5A' },
     'ogY8L*': { uid: 'ogY8L*', nick: 'Nn8)[v', pwd: 'wE9NP6W4' },
     'iuBs#ELxf#]BFOX':
      {
        uid: 'iuBs#ELxf#]BFOX',
        nick: 'yILXU*ZnZs&0FO3',
        pwd: 'rAI@!iTI$jGbKZ[k7Sri',
      },
     '#LIae#':
      {
        uid: '#LIae#',
        nick: 'Nde4C^pvKqYYg',
        pwd: 'rav[prNcl)Kt(&1Pk2Lc',
      },
     '#[cHFNXWUl':
      { uid: '#[cHFNXWUl', nick: '%hH&I', pwd: 'i]ROwwIMgihQT1Rn' },
     'JIGS2vxq8S4x%': { uid: 'JIGS2vxq8S4x%', nick: '#&7uq!k5', pwd: '!!yNpjR' },
     'tHZV1]P@)ZUqatFl':
      {
        uid: 'tHZV1]P@)ZUqatFl',
        nick: '@8&B[v03Ad6fc[waAr',
        pwd: ']B[GXPXhszMnq',
      },
     'G]5K90':
      {
        uid: 'G]5K90',
        nick: 'k3q$l^uKDL^@!)FPM',
        pwd: 'xan7bwpkVmE5iN',
      },
     '&3gyI]9LxDA':
      {
        uid: '&3gyI]9LxDA',
        nick: 'eU[$OXQ8a63IZyk',
        pwd: 'KB^iU$wsFl$',
      },
     '!V[0L]MErrH]b':
      {
        uid: '!V[0L]MErrH]b',
        nick: 'zft^z(7e',
        pwd: 'VeTDTl*(sYP!3hTw&',
      },
     '%ETp$g[Q6a8VwD4':
      {
        uid: '%ETp$g[Q6a8VwD4',
        nick: 'KoxtlObLxC',
        pwd: '*Ws&RQ5L8cZ^I',
      },
     'jAv^^cAusnl3x0m':
      {
        uid: 'jAv^^cAusnl3x0m',
        nick: 'g])!SU*#ze(u8O[*laGa',
        pwd: 'VcQ&QLO8',
      },
     'cDmkBXTH(i$)c2nB&Ys':
      {
        uid: 'cDmkBXTH(i$)c2nB&Ys',
        nick: 'U!u$%g@MgG2ZU)tiH0',
        pwd: 'J6!1S',
      },
     'A(W8jP@n3WWsn9JN': { uid: 'A(W8jP@n3WWsn9JN', nick: 'rxO8z', pwd: 'OtEV9^tg' },
     'fEScF*QFmW$cPoc9#':
      {
        uid: 'fEScF*QFmW$cPoc9#',
        nick: 'Z5P2$61PDpM^Tz1o',
        pwd: '5L6JO2^qYlPMSveh(BlV',
      },
     '9f2iguc3xyvc[(':
      { uid: '9f2iguc3xyvc[(', nick: 'Dk5iaf2!(ek)#2z', pwd: 'C(G0C' },
     'F]Tw^':
      { uid: 'F]Tw^', nick: 'TAqbLy', pwd: 'Ud3s15&1FQs&of66xqNC' },
     'NpMfUFRx':
      {
        uid: 'NpMfUFRx',
        nick: 'QWDrIk158$75^lJ',
        pwd: 'u0#[g5H4J4#Yr])L',
      },
     'Lbk!he': { uid: 'Lbk!he', nick: 'P%NLRwdwAbMOSS', pwd: 'LWGnSf' },
     'RAEq^': { uid: 'RAEq^', nick: 'DLA0tHR', pwd: 'PP![*(yGuMXLo9hM' },
     'bRoYMmBinO$D':
      {
        uid: 'bRoYMmBinO$D',
        nick: 'h@V[reLt4uUCSs9VqzyU',
        pwd: 'LRk2V%3T3qeR',
      },
     'AmiLQyY7OnSi(Lz7':
      { uid: 'AmiLQyY7OnSi(Lz7', nick: '!Uiq2', pwd: 'rOhMT&qyzU' },
     '2zrRCBQk':
      { uid: '2zrRCBQk', nick: 'U^)]#(', pwd: 'W9Z*L^x2zCp]HvbVC]zX' },
     'b)UBb]DD)I&8':
      {
        uid: 'b)UBb]DD)I&8',
        nick: 'pEi*&xRSj5W0z',
        pwd: 'IX7%(l1UU7D4rWH',
      },
     'mLvVgvgcn8rG)*U%P':
      {
        uid: 'mLvVgvgcn8rG)*U%P',
        nick: 'Eu!f@',
        pwd: 'c%hz](Gtwa6ijUk(P&N4',
      },
     'crAhOSlhJ':
      {
        uid: 'crAhOSlhJ',
        nick: 'YgXOQ5UFzH[Lu091vD*',
        pwd: 'M9JQ#V)Y^AX',
      },
     'nyaHX9OIAVLoX26cdpQ':
      {
        uid: 'nyaHX9OIAVLoX26cdpQ',
        nick: '#MMVi#Ar[pD02]YrC',
        pwd: 'wUl)T$Wk!]UWM]0J',
      },
     '$PSomO@)BA*i]13P5lxo':
      {
        uid: '$PSomO@)BA*i]13P5lxo',
        nick: '$2hLHOF%XfR1%',
        pwd: 'n0)xDHa5oT@OE0R7vcO',
      },
     ']h4eede':
      { uid: ']h4eede', nick: '0*YepOVgjo', pwd: 'FIo%Sp9QxXvHZi1z' },
     'XEol]V*wUTx&9)Cmgs':
      {
        uid: 'XEol]V*wUTx&9)Cmgs',
        nick: 'rgufJ$$jkZ[X$lK',
        pwd: ']KBxJ4ky',
      },
     '6LvR!uVwq':
      {
        uid: '6LvR!uVwq',
        nick: 'zj11As!8ZhCYO(b!',
        pwd: 'V)Q3fx@kJsEdRSW8[H8',
      },
     '^MzltE(wWQm%ap$No':
      {
        uid: '^MzltE(wWQm%ap$No',
        nick: '@(bo(ULteore',
        pwd: '7F8!dW54gS&X',
      },
     'N@^Vl': { uid: 'N@^Vl', nick: 'ZTqpp%8caE', pwd: 's[&Pk!Bo' },
     'c3EpcQiUExTYa':
      { uid: 'c3EpcQiUExTYa', nick: '(yJ@64', pwd: 'fT)O8vqs$QyNCS]p' },
     'e4GRgh': { uid: 'e4GRgh', nick: 'tTxYaLu^7EiW', pwd: 'U)ceqUa1q[f' },
     'Z^([rZ2x&&]': { uid: 'Z^([rZ2x&&]', nick: 'daQEY0Y', pwd: 'Vy#9PHNTo' },
     'AB&8rCO':
      { uid: 'AB&8rCO', nick: 'jB7ZSLP2', pwd: ']alWO#J%ef9Uvio[Guw' },
     'xIWo8z&TZav)]$^6':
      { uid: 'xIWo8z&TZav)]$^6', nick: 'cdm9jg', pwd: '3RLLNBiH#J' },
     'QCEpI':
      { uid: 'QCEpI', nick: 'zvBkrCKOBOkb2)F', pwd: 'PamtK2L(sRH%' },
     'SQ5Q9]d':
      {
        uid: 'SQ5Q9]d',
        nick: '5k%qm0ijc152',
        pwd: 'w%a%apz1Kh!6q)e[RwJc',
      },
     'q&NB1H': { uid: 'q&NB1H', nick: 'WFDOzth5(r2pD', pwd: 'SU$BI1]CK' },
     'SIZ5pH511U47*Z7Wmg]y':
      {
        uid: 'SIZ5pH511U47*Z7Wmg]y',
        nick: 'LCmVVNRJ8',
        pwd: 'u$[AX*6M(TERVtAD',
      },
     '&qrZ9pqwOHY':
      { uid: '&qrZ9pqwOHY', nick: 'svQS%9FPBjsUrDUz', pwd: 'wVNwk' },
     'A$dImu!vZ@qsV%nwSw':
      {
        uid: 'A$dImu!vZ@qsV%nwSw',
        nick: 'j4Y#0v[vsfGOTOTzpeU%',
        pwd: 'l$Rch7!76T2Q',
      },
   },
}

module.exports = users
