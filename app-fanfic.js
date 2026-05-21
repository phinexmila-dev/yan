// === FANFIC MODULE PART 1: Core Data, Tabs, Rendering ===
(function(){
'use strict';
function init(){
    if(!store.fanfic)store.fanfic={};
    var d=store.fanfic;
    if(!d.cps)d.cps=[];if(!d.stories)d.stories=[];if(!d.bookshelf)d.bookshelf=[];
    if(!d.settings)d.settings={penName:'',avatar:''};if(!d.drafts)d.drafts=[];
    if(!d.follows)d.follows=[];if(!d.collections)d.collections=[];
    if(!d.relays)d.relays=[];if(!d.settingGens)d.settingGens=[];if(!d.activities)d.activities=[];
    if(!d.customAuthors)d.customAuthors=[];if(!d.customActivities)d.customActivities=[];
    if(!d.readProgress)d.readProgress={};if(!d.readerSettings)d.readerSettings={pageMode:'scroll'};if(!d.bookmarks)d.bookmarks={};
    // [NEW] 预设提示词
    if(!d.customPrompts)d.customPrompts=[];
}
var aTab='discover',aGenre='全部';
var GENRES=['全部','现言','古言','末世','ABO','校园','悬疑','仙侠','娱圈','穿越'];
var COVERS=['#2BAE85','#3498db','#e67e22','#9b59b6','#1abc9c','#2980b9','#27ae60','#8e44ad','#16a085','#d35400'];
function rc(){return COVERS[Math.floor(Math.random()*COVERS.length)];}
window._ffRc=rc;window._ffCovers=COVERS;window._ffGenres=GENRES;window._ffInit=init;
window._ffTags=['甜宠','HE','BE','虐恋','双向暗恋','破镜重圆','先婚后爱','青梅竹马','欢喜冤家','强强','年下','救赎'];
var VA=[
    {id:'va_1',name:'月下听风',style:'古风唯美',avatar:'🌙',bio:'擅长古言虐恋',genres:['古言','仙侠']},
    {id:'va_2',name:'糖果工厂',style:'甜宠日常',avatar:'🍬',bio:'专注甜恋拒绝BE',genres:['现言','校园']},
    {id:'va_3',name:'深渊观测者',style:'暗黑悬疑',avatar:'🔮',bio:'结局总出人意料',genres:['悬疑','末世']},
    {id:'va_4',name:'星河漫步',style:'科幻浪漫',avatar:'✨',bio:'星辰大海写爱情',genres:['末世','ABO']},
    {id:'va_5',name:'桃花酿',style:'古风甜文',avatar:'🌸',bio:'诗意温柔古代风',genres:['古言','穿越']},
    {id:'va_6',name:'午夜电台',style:'都市情感',avatar:'🎙️',bio:'深夜心动瞬间',genres:['现言','娱圈']},
    {id:'va_7',name:'猫猫教主',style:'轻松搞笑',avatar:'🐱',bio:'沙雕甜文专业户',genres:['校园','现言']},
    {id:'va_8',name:'红尘客栈',style:'武侠江湖',avatar:'⚔️',bio:'江湖有酒有故事',genres:['仙侠','古言']}
];
window._ffVAuthors=VA;
var ACT=[
    {id:'act_1',title:'雨中重逢',desc:'下雨天意外重逢',reward:'首页推荐+雨滴边框',icon:'🌧️',color:'#74b9ff'},
    {id:'act_2',title:'反派救赎',desc:'反派的柔软内心',reward:'暗夜之星徽章',icon:'💔',color:'#a29bfe'},
    {id:'act_3',title:'春日告白',desc:'春天的告白故事',reward:'樱花边框',icon:'🌸',color:'#e17055'},
    {id:'act_4',title:'时光倒流',desc:'回到过去的选择',reward:'时光沙漏徽章',icon:'🔮',color:'#6c5ce7'},
    {id:'act_5',title:'身份互换',desc:'互换身份24小时',reward:'双面镜边框',icon:'🎭',color:'#00cec9'}
];
window._ffActivities=ACT;
function genEng(storyTags,storyGenre){
    var l=[];for(var i=0;i<Math.floor(Math.random()*80)+10;i++)l.push('u'+i);
    // 根据文章标签/类型选择匹配的评论
    var sweetCs=['好甜！','磕到了','甜死我了！','这也太甜了吧','嗑到了嗑到了','上头','爱了','啊啊啊上头了','太戳了','又甜又上头','好想谈恋爱','这糖我吃了','甜到牙疼','发糖发糖！','好甜好甜好甜','已收藏反复看','求更新！'];
    var angstCs=['泪目','哭死我了','意难平','太虐了呜呜','我的眼泪不值钱','刀子收一收吧','虐到心口疼','看哭了','这也太虐了','好虐好心疼','纸巾不够用了'];
    var generalCs=['太好看了','求更新','绝了','太会写了','催更！','意犹未尽','太绝了','已收藏','文笔太好了','越看越上头','写得真好','强烈推荐','一口气看完','角色太鲜活了','高产似那啥'];
    var suspenseCs=['好紧张','反转绝了','没猜到结局','太刺激了','氛围感拉满','细思极恐','伏笔好多','脑洞大开'];
    var campusCs=['青春的味道','想回学校了','好青春好美好','校园恋爱最好磕','课桌上的小纸条','操场那段太戳了'];
    var tags=(storyTags||[]).map(function(t){return t.toLowerCase();});
    var genre=(storyGenre||'').toLowerCase();
    var isSweetTag=tags.some(function(t){return t.indexOf('甜')>-1||t.indexOf('he')>-1||t==='甜宠'||t==='先婚后爱'||t==='青梅竹马'||t==='欢喜冤家'||t==='双向暗恋';});
    var isAngstTag=tags.some(function(t){return t.indexOf('虐')>-1||t.indexOf('be')>-1||t==='意难平';});
    var isSuspense=genre.indexOf('悬疑')>-1||genre.indexOf('末世')>-1;
    var isCampus=genre.indexOf('校园')>-1;
    var cs;
    if(isSweetTag&&!isAngstTag){cs=sweetCs.concat(generalCs.slice(0,5));}
    else if(isAngstTag&&!isSweetTag){cs=angstCs.concat(generalCs.slice(0,5));}
    else if(isSuspense){cs=suspenseCs.concat(generalCs);}
    else if(isCampus){cs=campusCs.concat(sweetCs.slice(0,5)).concat(generalCs.slice(0,5));}
    else{cs=generalCs.concat(sweetCs.slice(0,4));}
    var c=[];for(var j=0;j<Math.floor(Math.random()*10)+2;j++)c.push({user:VA[Math.floor(Math.random()*VA.length)].name,text:cs[Math.floor(Math.random()*cs.length)],time:Date.now()-Math.floor(Math.random()*86400000*7)});
    var v=Math.floor(Math.random()*500)+50;return{likes:l,comments:c,views:v};
}
window._ffGenEng=genEng;

function sCard(s){
    var ib=store.fanfic.bookshelf.indexOf(s.id)>-1,lc=(s.likes||[]).length,cc=(s.comments||[]).length,vc=s.views||0;
    // [FIX-字数] 始终基于实际内容长度计算字数，防止wordCount与content不同步
    var wc=(s.content||'').length;if(s.wordCount!==wc){s.wordCount=wc;}
    var ws=wc>10000?(wc/10000).toFixed(1)+'万':wc+'字';
    var tH=s.cpName?'<span class="ff-cp-badge2">💕'+escapeHtml(s.cpName)+'</span>':'';
    return '<div class="ff-scard2" onclick="openFanficRead(\''+s.id+'\')"><div class="ff-scard2-cover" style="background:'+(s.coverColor||rc())+'"><div class="ff-scard2-cover-text">'+escapeHtml((s.title||'').substring(0,2))+'</div></div><div class="ff-scard2-body"><div class="ff-scard2-title">'+escapeHtml(s.title||'无题')+'</div><div class="ff-scard2-author"><div class="ff-scard2-avatar">'+escapeHtml((s.author||'匿').charAt(0))+'</div><span>'+escapeHtml(s.author||'匿名')+'</span></div><div class="ff-scard2-desc">'+escapeHtml((s.summary||s.content||'').substring(0,50))+'</div><div class="ff-scard2-footer">'+tH+'<div class="ff-scard2-stats"><span><i class="far fa-eye"></i>'+vc+'</span><span><i class="far fa-heart"></i>'+lc+'</span><span><i class="far fa-comment"></i>'+cc+'</span><span>'+ws+'</span></div><div class="ff-scard2-bm '+(ib?'active':'')+'" onclick="event.stopPropagation();ffToggleBookshelf(\''+s.id+'\')"><i class="'+(ib?'fas':'far')+' fa-bookmark"></i></div></div></div></div>';
}
window._ffSCard=sCard;

window.renderFanficHome=function(){
    init();var el=document.getElementById('fanfic-content');if(!el)return;
    var tabs=[{k:'discover',i:'fa-compass',l:'发现'},{k:'relay',i:'fa-users',l:'接龙'},{k:'bookshelf',i:'fa-bookmark',l:'收藏'},{k:'follow',i:'fa-user-plus',l:'关注'},{k:'mine',i:'fa-user',l:'我的'}];
    var tH='';for(var i=0;i<tabs.length;i++){var t=tabs[i];tH+='<div class="ff-btab '+(aTab===t.k?'active':'')+'" onclick="ffSwitchTab(\''+t.k+'\')"><i class="fas '+t.i+'"></i><span>'+t.l+'</span></div>';}
    el.innerHTML='<div class="ff-app2"><div class="ff-header2"><div class="ff-header2-left" onclick="exitApp()"><i class="fas fa-chevron-left"></i></div><div class="ff-header2-title"><i class="fas fa-feather-alt"></i> 同人世界</div><div class="ff-header2-right"><div class="ff-hbtn" onclick="ffOpenDashboard()"><i class="fas fa-chart-pie"></i></div><div class="ff-hbtn" onclick="ffOpenReport()"><i class="fas fa-id-card"></i></div><div class="ff-hbtn" onclick="openFanficSettings()"><i class="fas fa-cog"></i></div></div></div><div class="ff-body2" id="ff-body"></div><div class="ff-bottom-bar2">'+tH+'</div><div class="ff-fab2" onclick="ffShowCreateMenu()"><i class="fas fa-plus"></i></div></div>';
    rTab();
};
window.ffSwitchTab=function(t){aTab=t;var e=document.querySelectorAll('.ff-btab');for(var i=0;i<e.length;i++)e[i].classList.toggle('active',e[i].textContent.trim()===({discover:'发现',relay:'接龙',bookshelf:'收藏',follow:'关注',mine:'我的'}[t]||''));rTab();};
window.ffFilterGenre=function(g){aGenre=g;rTab();};
function rTab(){var b=document.getElementById('ff-body');if(!b)return;({discover:rDiscover,relay:rRelay,bookshelf:rBookshelf,follow:rFollow,mine:rMine}[aTab]||rDiscover)(b);}

window.ffShowCreateMenu=function(){
    var x=document.getElementById('ff-create-menu');if(x)x.remove();
    var d=document.createElement('div');d.id='ff-create-menu';d.className='ff-create-menu-overlay';
    var items=[['openFanficWriteNew','fa-pen-fancy','写同人','#2BAE85,#1a9e75'],['openFanficCPManager','fa-heart','管理CP','#3498db,#2980b9'],['ffOpenStyleManager','fa-feather-alt','文风管理','#8e44ad,#7d3c98'],['ffOpenSettingGen','fa-magic','设定生成','#1abc9c,#16a085'],['ffStartRelay','fa-link','发起接龙','#e67e22,#d35400'],['ffOpenActivities','fa-trophy','主题活动','#f39c12,#e67e22'],['ffGenerateRecommended','fa-sync-alt','AI推荐','#27ae60,#229954']];
    var g='';for(var i=0;i<items.length;i++){var it=items[i];g+='<div class="ff-cmenu-item" onclick="this.closest(\'.ff-create-menu-overlay\').remove();'+it[0]+'()"><div class="ff-cmenu-icon" style="background:linear-gradient(135deg,'+it[3]+')"><i class="fas '+it[1]+'"></i></div><span>'+it[2]+'</span></div>';}
    d.innerHTML='<div class="ff-cmenu-bg" onclick="this.parentElement.remove()"></div><div class="ff-cmenu-panel"><div class="ff-cmenu-title">✨ 创作中心</div><div class="ff-cmenu-grid">'+g+'</div><div class="ff-cmenu-close" onclick="this.closest(\'.ff-create-menu-overlay\').remove()"><i class="fas fa-times"></i></div></div>';
    document.body.appendChild(d);
};

function rDiscover(b){
    var st=store.fanfic.stories.filter(function(s){return s.status==='published';}),gh='<div class="ff-genre-bar2">';
    for(var i=0;i<GENRES.length;i++)gh+='<div class="ff-genre-chip2 '+(aGenre===GENRES[i]?'active':'')+'" onclick="ffFilterGenre(\''+GENRES[i]+'\')">'+GENRES[i]+'</div>';
    gh+='</div>';
    var fl=aGenre==='全部'?st:st.filter(function(s){return s.genre===aGenre;});
    fl.sort(function(a,z){return(z.time||0)-(a.time||0);});
    var cps=store.fanfic.cps,ch='';
    if(cps.length>0){ch='<div class="ff-cp-section2"><div class="ff-sec-title2"><i class="fas fa-heart" style="color:#ff6b81"></i> 我的CP</div><div class="ff-cp-scroll2">';for(var c=0;c<cps.length;c++){var cp=cps[c];ch+='<div class="ff-cp-chip2" onclick="ffGenerateForCP(\''+cp.id+'\')"><span>'+escapeHtml(cp.char1.name)+'</span><span class="ff-cp-x">×</span><span>'+escapeHtml(cp.char2.name)+'</span></div>';}ch+='<div class="ff-cp-chip2 ff-cp-add2" onclick="openFanficCPManager()"><i class="fas fa-plus"></i></div></div></div>';}
    var aH='<div class="ff-act-banner2">';for(var a=0;a<2;a++){var ac=ACT[a];aH+='<div class="ff-act-card2" style="background:'+ac.color+'15;border-left:3px solid '+ac.color+'" onclick="ffJoinActivity(\''+ac.id+'\')"><div class="ff-act-card2-icon">'+ac.icon+'</div><div class="ff-act-card2-info"><div>'+ac.title+'</div><div class="ff-act-card2-reward">🎁 '+ac.reward+'</div></div></div>';}aH+='</div>';
    var sh='';if(!fl.length)sh='<div class="ff-empty2"><div class="ff-empty2-icon">📚</div><div class="ff-empty2-text">还没有作品</div><button class="ff-btn-primary2" onclick="ffGenerateRecommended()"><i class="fas fa-magic"></i> AI生成</button></div>';
    else{sh='<div class="ff-story-list2">';for(var s=0;s<fl.length;s++)sh+=sCard(fl[s]);sh+='</div>';}
    b.innerHTML=aH+ch+gh+'<div class="ff-sec-header2"><div class="ff-sec-title2">✨ 推荐</div><div class="ff-sec-more2" onclick="ffGenerateRecommended()"><i class="fas fa-sync-alt"></i> 换一批</div></div>'+sh;
}
function rRelay(b){
    var rl=store.fanfic.relays||[],h='<div class="ff-sec-header2" style="padding-top:16px"><div class="ff-sec-title2">📝 接龙</div><div class="ff-sec-more2" onclick="ffStartRelay()"><i class="fas fa-plus"></i></div></div>';
    if(!rl.length)h+='<div class="ff-empty2"><div class="ff-empty2-icon">🔗</div><div class="ff-empty2-text">还没有接龙</div><button class="ff-btn-primary2" onclick="ffStartRelay()"><i class="fas fa-link"></i> 发起</button></div>';
    else{h+='<div class="ff-relay-list">';for(var i=0;i<rl.length;i++){var r=rl[i],pc=(r.parts||[]).length;h+='<div class="ff-relay-card" onclick="ffOpenRelayDetail(\''+r.id+'\')"><div class="ff-relay-card-title">'+escapeHtml(r.title||'无题')+'</div><div class="ff-relay-card-meta">'+pc+'段 · '+(r.status==='active'?'进行中':'完结')+'</div></div>';}h+='</div>';}
    b.innerHTML=h;
}
function rBookshelf(b){
    var ids=store.fanfic.bookshelf||[],st=[],cols=store.fanfic.collections||[];
    for(var i=0;i<ids.length;i++)for(var j=0;j<store.fanfic.stories.length;j++)if(store.fanfic.stories[j].id===ids[i]){st.push(store.fanfic.stories[j]);break;}
    var h='<div class="ff-sec-header2" style="padding-top:16px"><div class="ff-sec-title2">⭐ 收藏</div></div>';
    if(cols.length>0){h+='<div class="ff-col-list">';for(var c=0;c<cols.length;c++){var co=cols[c];h+='<div class="ff-col-card"><div class="ff-col-card-icon">'+(co.type==='setting'?'🎨':'📝')+'</div><div class="ff-col-card-title">'+escapeHtml(co.title||'')+'</div><div class="ff-col-del" onclick="ffDelCollection(\''+co.id+'\')"><i class="fas fa-trash-alt"></i></div></div>';}h+='</div>';}
    if(!st.length)h+='<div class="ff-empty2"><div class="ff-empty2-icon">📖</div><div class="ff-empty2-text">还没有收藏</div></div>';
    else{h+='<div class="ff-shelf-grid2">';for(var s=0;s<st.length;s++){var x=st[s];h+='<div class="ff-shelf-item2" onclick="openFanficRead(\''+x.id+'\')"><div class="ff-shelf-cover2" style="background:'+(x.coverColor||rc())+'">'+(x.title||'').substring(0,4)+'</div><div class="ff-shelf-name2">'+escapeHtml(x.title||'')+'</div></div>';}h+='</div>';}
    b.innerHTML=h;
}
function rFollow(b){
    var fl=store.fanfic.follows||[],h='<div class="ff-sec-header2" style="padding-top:16px"><div class="ff-sec-title2">👥 虚拟作者</div></div><div class="ff-va-list">';
    for(var i=0;i<VA.length;i++){var v=VA[i],isF=fl.indexOf(v.id)>-1;h+='<div class="ff-va-card"><div class="ff-va-avatar">'+v.avatar+'</div><div class="ff-va-info"><div class="ff-va-name">'+v.name+' <span class="ff-va-style">'+v.style+'</span></div><div class="ff-va-bio">'+v.bio+'</div></div><button class="ff-follow-btn '+(isF?'followed':'')+'" onclick="ffToggleFollow(\''+v.id+'\')">'+(isF?'已关注':'关注')+'</button></div>';}
    h+='</div>';b.innerHTML=h;
}
function rMine(b){
    var pn=store.fanfic.settings.penName||(store.user&&store.user.name?store.user.name:'匿名');
    var av=store.fanfic.settings.avatar||'';
    var my=store.fanfic.stories.filter(function(s){return s.isMe;}),pub=my.filter(function(s){return s.status==='published';}),dr=store.fanfic.drafts||[];
    var tl=0,tw=0;for(var i=0;i<pub.length;i++){tl+=(pub[i].likes||[]).length;tw+=(pub[i].wordCount||0);}
    var avatarHtml=av?'<div class="ff-mine-avatar2" style="padding:0;overflow:hidden;" onclick="ffChangeAvatar()"><img src="'+escapeHtml(av)+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML=\''+pn.charAt(0)+'\';this.parentElement.style.padding=\'\'"></div>':'<div class="ff-mine-avatar2" onclick="ffChangeAvatar()">'+pn.charAt(0)+'</div>';
    var tvw=0;for(var v=0;v<pub.length;v++)tvw+=(pub[v].views||0);
    var h='<div class="ff-mine-header2">'+avatarHtml+'<div class="ff-mine-name2">'+escapeHtml(pn)+'</div><div class="ff-mine-stats2"><div><span>'+pub.length+'</span><span>作品</span></div><div><span>'+tl+'</span><span>获赞</span></div><div><span>'+tvw+'</span><span>阅读</span></div><div><span>'+tw+'</span><span>字数</span></div></div><div class="ff-mine-actions2"><button class="ff-mine-abtn" onclick="ffOpenDashboard()"><i class="fas fa-chart-bar"></i> 数据</button><button class="ff-mine-abtn" onclick="ffOpenReport()"><i class="fas fa-id-card"></i> 报告</button><button class="ff-mine-abtn" onclick="ffBoostAllStories()" style="background:#3498db;color:#fff;border:none"><i class="fas fa-magic"></i> 生成互动</button></div></div>';
    if(dr.length>0){h+='<div class="ff-draft-label2">草稿 ('+dr.length+')</div>';for(var d=0;d<dr.length;d++){var df=dr[d];h+='<div class="ff-mine-item2 draft" onclick="openFanficEditDraft(\''+df.id+'\')"><span>📝 '+escapeHtml(df.title||'未命名')+'</span><span class="ff-mine-item2-del" onclick="event.stopPropagation();deleteFanficDraft(\''+df.id+'\')"><i class="fas fa-trash-alt"></i></span></div>';}}
    pub.sort(function(a,z){return(z.time||0)-(a.time||0);});
    for(var p=0;p<pub.length;p++){var s=pub[p];h+='<div class="ff-mine-item2" onclick="openFanficRead(\''+s.id+'\')"><div class="ff-mine-item2-cover" style="background:'+(s.coverColor||rc())+'">'+(s.title||'').charAt(0)+'</div><div class="ff-mine-item2-info"><div>'+escapeHtml(s.title||'无题')+'</div><div class="ff-mine-item2-meta">'+(s.genre||'')+' · <i class="far fa-eye"></i>'+(s.views||0)+' · <i class="far fa-heart"></i>'+(s.likes||[]).length+' · <i class="far fa-comment"></i>'+(s.comments||[]).length+'</div></div><span class="ff-mine-item2-del" onclick="event.stopPropagation();deleteFanficStory(\''+s.id+'\')"><i class="fas fa-trash-alt"></i></span></div>';}
    if(!pub.length&&!dr.length)h+='<div class="ff-empty2"><div style="color:#999">还没有作品</div></div>';
    b.innerHTML=h;
}

// === ACTIONS ===
window.ffToggleBookshelf=function(sid){init();var idx=store.fanfic.bookshelf.indexOf(sid);if(idx>-1)store.fanfic.bookshelf.splice(idx,1);else store.fanfic.bookshelf.push(sid);saveStore();rTab();};
window.ffToggleFollow=function(vid){init();var idx=store.fanfic.follows.indexOf(vid);if(idx>-1)store.fanfic.follows.splice(idx,1);else store.fanfic.follows.push(vid);saveStore();rTab();};
window.ffDelCollection=function(cid){init();store.fanfic.collections=store.fanfic.collections.filter(function(c){return c.id!==cid;});saveStore();rTab();};

// === 统一标题提取函数：处理AI生成的各种标题格式 ===
window._ffExtractTitle=function(text,fallback){
    if(!text)return{title:fallback||'无题',content:''};
    text=text.trim();
    // 依次尝试多种常见AI输出的标题格式
    var patterns=[
        /^#{1,3}\s*《(.+?)》\s*\n/,           // ### 《标题》
        /^#{1,3}\s+(.{2,30})\s*\n/,           // # 标题 / ## 标题 / ### 标题
        /^《(.+?)》\s*\n/,                      // 《标题》
        /^【(.+?)】\s*\n/,                      // 【标题】
        /^\*{1,2}《(.+?)》\*{1,2}\s*\n/,       // **《标题》**
        /^\*{1,2}(.{2,30})\*{1,2}\s*\n/,       // **标题**
        /^[Tt]itle[:：]\s*(.{2,30})\s*\n/,     // Title: 标题
        /^标题[:：]\s*(.{2,30})\s*\n/,          // 标题：xxx
        /^(.{2,20})\s*\n\s*[-=]{3,}\s*\n/,    // 标题\n---\n (Markdown setext)
        /^(.{2,20})\s*\n\n/                    // 简短首行作标题（2-20字后跟空行）
    ];
    for(var i=0;i<patterns.length;i++){
        var m=text.match(patterns[i]);
        if(m){
            var title=m[1].replace(/^[#\s*]+/,'').replace(/[#\s*]+$/,'').trim();
            if(title.length>=2&&title.length<=30){
                var content=text.substring(m[0].length).trim();
                // 去掉正文开头可能残留的分隔线
                content=content.replace(/^[-=]{3,}\s*\n/,'').trim();
                return{title:title,content:content};
            }
        }
    }
    // 最后兜底：首行不超过30字就当标题
    var firstNl=text.indexOf('\n');
    if(firstNl>0&&firstNl<=30){
        var firstLine=text.substring(0,firstNl).replace(/^[#*《【\s]+/,'').replace(/[#*》】\s]+$/,'').trim();
        if(firstLine.length>=2&&firstLine.length<=30){
            return{title:firstLine,content:text.substring(firstNl+1).trim()};
        }
    }
    return{title:fallback||'无题',content:text};
};

// [FIX-乱码] 内容清洗：检测并截断AI生成的重复/乱码文本
window._ffSanitizeContent=function(text){
    if(!text||text.length<200)return text;
    // 检测重复模式：如果连续出现相同的短语超过5次，截断到第一次重复处
    // 使用滑动窗口检测重复
    var len=text.length;
    // 检测连续重复片段（10-50字符的重复块）
    for(var blockSize=10;blockSize<=50;blockSize+=10){
        for(var i=Math.min(len-blockSize*5, Math.floor(len*0.3));i<len-blockSize*5;i++){
            if(i<0)continue;
            var block=text.substring(i,i+blockSize);
            if(/^\s+$/.test(block))continue; // 跳过空白块
            var repeatCount=0;
            for(var j=i+blockSize;j<=len-blockSize;j+=blockSize){
                if(text.substring(j,j+blockSize)===block)repeatCount++;
                else break;
            }
            if(repeatCount>=4){
                // 找到重复起始点，截断内容
                console.warn('[fanfic] 检测到重复文本，在位置',i,'截断（重复块:',block.substring(0,20),'...，重复',repeatCount,'次）');
                var cleaned=text.substring(0,i).trim();
                // 尝试在最后一个完整句子处截断
                var lastSentEnd=Math.max(cleaned.lastIndexOf('。'),cleaned.lastIndexOf('！'),cleaned.lastIndexOf('？'),cleaned.lastIndexOf('"'),cleaned.lastIndexOf('\n'));
                if(lastSentEnd>cleaned.length*0.8)cleaned=cleaned.substring(0,lastSentEnd+1);
                return cleaned;
            }
        }
    }
    // 检测乱码：大量非中日韩/非ASCII可打印字符
    var lastGoodPos=len;
    var windowSize=100;
    for(var k=0;k<len-windowSize;k+=50){
        var win=text.substring(k,k+windowSize);
        // 计算可读字符比例
        var readable=0;
        for(var c=0;c<win.length;c++){
            var code=win.charCodeAt(c);
            if((code>=0x4e00&&code<=0x9fff)||  // CJK统一汉字
               (code>=0x3000&&code<=0x303f)||  // CJK标点
               (code>=0xff00&&code<=0xffef)||  // 全角字符
               (code>=0x20&&code<=0x7e)||      // ASCII可打印
               code===0x0a||code===0x0d)       // 换行
                readable++;
        }
        if(readable/win.length<0.5){
            lastGoodPos=k;
            console.warn('[fanfic] 检测到不可读内容，在位置',k,'截断');
            break;
        }
    }
    if(lastGoodPos<len){
        var cleaned2=text.substring(0,lastGoodPos).trim();
        var lastSent2=Math.max(cleaned2.lastIndexOf('。'),cleaned2.lastIndexOf('！'),cleaned2.lastIndexOf('？'),cleaned2.lastIndexOf('\n'));
        if(lastSent2>cleaned2.length*0.7)cleaned2=cleaned2.substring(0,lastSent2+1);
        return cleaned2;
    }
    return text;
};

// [FIX-字数] 同步wordCount：始终基于实际内容长度
window._ffSyncWordCount=function(story){
    if(!story)return;
    var actualLen=(story.content||'').length;
    if(story.wordCount!==actualLen){
        story.wordCount=actualLen;
    }
};

// [FIX-字数] 高max_tokens的API调用封装，用于长文生成
// [FIX-续写死锁] 添加600秒超时保护，防止API请求挂起导致锁永远不释放
window._ffApiCall=async function(messages,temperature){
    var temp=temperature||0.9;
    _currentApiScene = 'fanfic';
    // 为同人文生成使用更高的max_tokens，覆盖全局设置（8000 tokens支持更长文章）
    // [MOD] 不做超时限制，让API请求自然等待
    return await API.chatCompletion(messages,{temperature:temp,maxTokens:8000,scene:'fanfic'});
};

})();
// === FANFIC MODULE PART 2: Read, Write, Settings, Drafts ===
(function(){
'use strict';
var rc=window._ffRc,init=window._ffInit;

// === CHAPTER SYSTEM ===
window._ffParseChapters=function(content){
    if(!content)return[{title:'正文',content:''}];
    // Try to split by chapter markers: 第X章, Chapter X, 【第X章】, etc.
    var re=/(?:^|\n)((?:第[一二三四五六七八九十百千\d]+章|Chapter\s*\d+|【第[一二三四五六七八九十百千\d]+章[^】]*】)[^\n]*)/gi;
    var matches=[],m;
    while((m=re.exec(content))!==null){matches.push({idx:m.index+(m[0].startsWith('\n')?1:0),title:m[1].trim()});}
    if(matches.length===0)return[{title:'正文',content:content}];
    var chapters=[];
    // Content before first chapter marker
    if(matches[0].idx>0){var pre=content.substring(0,matches[0].idx).trim();if(pre)chapters.push({title:'序章',content:pre});}
    for(var i=0;i<matches.length;i++){
        var start=matches[i].idx;var end=(i+1<matches.length)?matches[i+1].idx:content.length;
        var chContent=content.substring(start,end).trim();
        // Remove the title line from content body
        var firstNl=chContent.indexOf('\n');
        var body=firstNl>-1?chContent.substring(firstNl+1).trim():chContent;
        chapters.push({title:matches[i].title,content:body});
    }
    return chapters;
};
window._ffCurrentChapter=0;

// === READ - 书籍详情页 ===
window.openFanficRead=function(sid){
    init();var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return toast('作品不存在');
    // [FIX-乱码] 打开作品时清洗内容，去除重复/乱码文本
    if(s.content&&window._ffSanitizeContent){
        var cleaned=window._ffSanitizeContent(s.content);
        if(cleaned!==s.content){
            console.warn('[fanfic] 内容已清洗，原长度:',s.content.length,'清洗后:',cleaned.length);
            s.content=cleaned;s.wordCount=cleaned.length;
            if(typeof save==='function')save();
        }
    }
    var ly=document.getElementById('layer-fanfic-read');ly.classList.add('show');
    var ib=store.fanfic.bookshelf.indexOf(sid)>-1;
    var chapters=window._ffParseChapters(s.content);
    if(!s.views)s.views=0;s.views++;if(typeof save==='function')save();
    // [FIX-字数] 始终基于实际内容长度，防止与存储的wordCount不一致
    var wc=(s.content||'').length;if(s.wordCount!==wc){s.wordCount=wc;}
    var ws=wc>10000?(wc/10000).toFixed(1)+'万字':wc+'字';
    var tagsH='';if(s.tags&&s.tags.length)for(var i=0;i<s.tags.length;i++)tagsH+='<span class="ff-book-detail-meta-tag">'+escapeHtml(s.tags[i])+'</span>';
    var genreH=s.genre?'<span class="ff-book-detail-meta-genre">'+escapeHtml(s.genre)+'</span>':'';
    var cpH=s.cpName?'<div class="ff-book-detail-cp-section"><span style="font-size:13px;color:#999">CP：</span><span class="ff-book-detail-cp-name">'+escapeHtml(s.cpName)+'</span></div>':'';
    var d=new Date(s.time||Date.now());var timeStr=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    var tocH='';if(chapters.length>1){tocH='<div class="ff-book-detail-toc-section"><div class="ff-book-detail-toc-title">目录 ('+chapters.length+'章)</div>';for(var j=0;j<Math.min(chapters.length,10);j++){tocH+='<div class="ff-book-detail-toc-item" onclick="ffStartReader(\''+sid+'\','+j+')"><span>'+escapeHtml(chapters[j].title)+'</span><span>'+chapters[j].content.length+'字</span></div>';}if(chapters.length>10)tocH+='<div style="text-align:center;padding:10px;color:#999;font-size:13px" onclick="ffStartReader(\''+sid+'\',0)">查看全部 '+chapters.length+' 章 ›</div>';tocH+='</div>';}
    var commentsH='';(s.comments||[]).slice(-5).reverse().forEach(function(c){commentsH+='<div style="padding:8px 0;border-bottom:1px solid #f0f0f0"><div style="font-size:13px;color:#2BAE85;font-weight:500">'+escapeHtml(c.user||'读者')+'</div><div style="font-size:13px;color:#666;margin-top:4px">'+escapeHtml(c.text)+'</div></div>';});
    ly.innerHTML='<div class="ff-book-detail"><div class="ff-book-detail-header"><div class="ff-book-detail-back" onclick="closeFanficRead()"><i class="fas fa-chevron-left"></i></div><div class="ff-book-detail-htitle">书籍详情</div><div style="width:34px"></div></div>'+
    '<div class="ff-book-detail-body"><div class="ff-book-detail-cover-section"><div class="ff-book-detail-cover" style="background:'+(s.coverColor||rc())+'"><div class="ff-book-detail-cover-text">'+(s.title||'').substring(0,2)+'</div></div>'+
    '<div class="ff-book-detail-info"><div class="ff-book-detail-title">'+escapeHtml(s.title||'无题')+'</div><div class="ff-book-detail-author"><i class="fas fa-user"></i> '+escapeHtml(s.author||'匿名')+'</div><div class="ff-book-detail-meta">'+genreH+tagsH+'</div><div class="ff-book-detail-stats"><span><i class="far fa-eye"></i> '+(s.views||0)+'</span><span><i class="far fa-heart"></i> '+(s.likes||[]).length+'</span><span><i class="far fa-comment"></i> '+(s.comments||[]).length+'</span><span>'+ws+'</span></div><div class="ff-book-detail-update">更新：'+timeStr+'</div></div></div>'+
    '<div class="ff-book-detail-summary-section"><div class="ff-book-detail-summary-title">简介</div><div class="ff-book-detail-summary-text">'+escapeHtml(s.summary||s.content.substring(0,120)||'暂无简介')+'</div></div>'+
    cpH+tocH+
    '<div style="padding:16px;background:#fff;margin-top:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:14px;font-weight:600;color:#333">评论 ('+(s.comments||[]).length+')</div><div style="display:flex;gap:8px"><div onclick="ffManualGenComments(\''+sid+'\')" style="font-size:12px;color:#2BAE85;cursor:pointer;padding:4px 10px;border:1px solid #2BAE85;border-radius:12px;"><i class="fas fa-sync-alt"></i> 刷新评论</div><div onclick="ffAddComment(\''+sid+'\')" style="font-size:12px;color:#fff;background:#2BAE85;cursor:pointer;padding:4px 10px;border-radius:12px;"><i class="fas fa-pen"></i> 写评论</div></div></div>'+(commentsH||'<div style="padding:20px 0;text-align:center;color:#999;font-size:13px">暂无评论，点击"刷新评论"生成AI评论</div>')+'</div>'+
    '</div>'+
    '<div class="ff-book-detail-actions"><div class="ff-book-detail-del-btn" onclick="event.stopPropagation();if(confirm(\'确定删除此作品？删除后不可恢复。\')){deleteFanficStory(\''+sid+'\');closeFanficRead();}"><i class="fas fa-trash-alt"></i></div><div class="ff-book-detail-fav-btn" onclick="ffShareToContact(\''+sid+'\')"><i class="fas fa-share"></i><span>分享</span></div><div class="ff-book-detail-fav-btn '+(ib?'active':'')+'" onclick="ffToggleBookshelf(\''+sid+'\');openFanficRead(\''+sid+'\')"><i class="'+(ib?'fas':'far')+' fa-bookmark"></i><span>'+(ib?'已收藏':'收藏')+'</span></div><div class="ff-book-detail-continue-btn" onclick="ffContinueStoryChapter(\''+sid+'\')"><i class="fas fa-pen-fancy"></i><span>续写下一章</span></div><div class="ff-book-detail-read-btn" onclick="ffStartReader(\''+sid+'\',0)"><i class="fas fa-book-open"></i> '+(store.fanfic.bookmarks&&store.fanfic.bookmarks[sid]?'继续阅读':'开始阅读')+'</div></div></div>';
};

// === 沉浸式阅读器 ===
window._ffReaderState={sid:'',ci:0,menuShow:false,fontSize:18,bgTheme:'default',fontColor:'#333'};
window.ffStartReader=function(sid,ci){
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    var chapters=window._ffParseChapters(s.content);
    if(ci<0)ci=0;if(ci>=chapters.length)ci=chapters.length-1;
    var st=window._ffReaderState;st.sid=sid;st.ci=ci;st.menuShow=false;
    window._ffCurrentChapter=ci;
    var ly=document.getElementById('layer-fanfic-read');ly.classList.add('show');
    ffRenderReader();
};
window.ffRenderReader=function(){
    var st=window._ffReaderState,sid=st.sid,ci=st.ci;
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    var chapters=window._ffParseChapters(s.content);
    var curCh=chapters[ci];var hasMulti=chapters.length>1;
    var ly=document.getElementById('layer-fanfic-read');
    var chNavH='';
    if(hasMulti){chNavH='<div class="ff-reader-chapter-nav"><button class="ff-reader-ch-btn '+(ci<=0?'disabled':'')+'" onclick="'+(ci>0?'ffReaderGo('+(ci-1)+')':'')+'"><i class="fas fa-chevron-left"></i> 上一章</button><span class="ff-reader-ch-indicator">'+(ci+1)+'/'+chapters.length+'</span><button class="ff-reader-ch-btn '+(ci>=chapters.length-1?'disabled':'')+'" onclick="'+(ci<chapters.length-1?'ffReaderGo('+(ci+1)+')':'')+'">下一章 <i class="fas fa-chevron-right"></i></button></div>';}
    ly.innerHTML='<div class="ff-reader"><div class="ff-reader-top" id="ff-reader-top"><div class="ff-reader-top-safe"></div><div class="ff-reader-top-bar"><div class="ff-reader-top-back" onclick="ffReaderBack()"><i class="fas fa-chevron-left"></i></div><div class="ff-reader-top-info"><div class="ff-reader-top-title">'+escapeHtml(s.title||'')+'</div>'+(hasMulti?'<div class="ff-reader-top-chapter">'+escapeHtml(curCh.title)+'</div>':'')+'</div></div></div>'+
    '<div class="ff-reader-content theme-'+st.bgTheme+'" id="ff-reader-content" onclick="ffReaderToggleMenu()"><div class="ff-reader-chapter-title" style="color:'+st.fontColor+'">'+escapeHtml(curCh.title)+'</div><div class="ff-reader-text" id="ff-reader-text" style="font-size:'+st.fontSize+'px;color:'+st.fontColor+'">'+escapeHtml(curCh.content||'').replace(/\n/g,'<br>')+'</div>'+chNavH+'</div>'+
    '<div class="ff-reader-bottom" id="ff-reader-bottom"><div class="ff-reader-bottom-bar"><div class="ff-reader-bottom-btn" onclick="event.stopPropagation();ffReaderOpenTOC()"><i class="fas fa-list"></i><span>目录</span></div><div class="ff-reader-bottom-btn" onclick="event.stopPropagation();ffReaderOpenSettings()"><i class="fas fa-font"></i><span>设置</span></div><div class="ff-reader-bottom-btn ff-bookmark-btn" onclick="event.stopPropagation();ffBookmarkCurrent()"><i class="fas fa-map-marker-alt"></i><span>标记</span></div><div class="ff-reader-bottom-btn" onclick="event.stopPropagation();ffReaderToggleNight()"><i class="fas fa-moon"></i><span>夜间</span></div><div class="ff-reader-bottom-btn" onclick="event.stopPropagation();ffContinueStoryChapter(\''+sid+'\')"><i class="fas fa-pen"></i><span>续写</span></div></div><div class="ff-reader-bottom-safe"></div></div>'+
    '<div class="ff-reader-settings-mask" id="ff-reader-settings-mask" onclick="ffReaderCloseSettings()"></div><div class="ff-reader-settings" id="ff-reader-settings"><div class="ff-reader-settings-row"><div class="ff-reader-settings-label">字号</div><div class="ff-reader-settings-options"><div class="ff-reader-font-btn" onclick="ffReaderFontSize(-2)">A-</div><div class="ff-reader-font-size-display" id="ff-reader-fs">'+st.fontSize+'</div><div class="ff-reader-font-btn" onclick="ffReaderFontSize(2)">A+</div></div></div><div class="ff-reader-settings-row"><div class="ff-reader-settings-label">背景</div><div class="ff-reader-settings-options"><div class="ff-reader-bg-btn '+(st.bgTheme==='default'?'active':'')+'" style="background:#f5efe6" onclick="ffReaderBg(\'default\')"></div><div class="ff-reader-bg-btn '+(st.bgTheme==='green'?'active':'')+'" style="background:#cce8cf" onclick="ffReaderBg(\'green\')"></div><div class="ff-reader-bg-btn '+(st.bgTheme==='white'?'active':'')+'" style="background:#fff;border:1px solid #ddd" onclick="ffReaderBg(\'white\')"></div><div class="ff-reader-bg-btn '+(st.bgTheme==='sepia'?'active':'')+'" style="background:#f4ecd8" onclick="ffReaderBg(\'sepia\')"></div><div class="ff-reader-bg-btn '+(st.bgTheme==='dark'?'active':'')+'" style="background:#1a1a1a" onclick="ffReaderBg(\'dark\')"></div></div></div><div class="ff-reader-settings-row"><div class="ff-reader-settings-label">字色</div><div class="ff-reader-settings-options"><div class="ff-reader-color-btn '+(st.fontColor==='#333'?'active':'')+'" style="background:#333;color:#fff" onclick="ffReaderColor(\'#333\')">A</div><div class="ff-reader-color-btn '+(st.fontColor==='#5b4636'?'active':'')+'" style="background:#5b4636;color:#fff" onclick="ffReaderColor(\'#5b4636\')">A</div><div class="ff-reader-color-btn '+(st.fontColor==='#2c3e2c'?'active':'')+'" style="background:#2c3e2c;color:#fff" onclick="ffReaderColor(\'#2c3e2c\')">A</div><div class="ff-reader-color-btn '+(st.fontColor==='#c8c8c8'?'active':'')+'" style="background:#c8c8c8;color:#333" onclick="ffReaderColor(\'#c8c8c8\')">A</div></div></div></div></div>';
    setTimeout(function(){var rc=document.getElementById('ff-reader-content');if(rc)rc.scrollTop=0;},50);
};
window.ffReaderToggleMenu=function(){
    var st=window._ffReaderState;st.menuShow=!st.menuShow;
    var top=document.getElementById('ff-reader-top'),bot=document.getElementById('ff-reader-bottom');
    if(top)top.classList.toggle('show',st.menuShow);if(bot)bot.classList.toggle('show',st.menuShow);
    if(!st.menuShow)ffReaderCloseSettings();
};
window.ffReaderBack=function(){openFanficRead(window._ffReaderState.sid);};
window.ffReaderGo=function(ci){var st=window._ffReaderState;st.ci=ci;st.menuShow=false;window._ffCurrentChapter=ci;ffRenderReader();};
window.ffReaderOpenTOC=function(){ffOpenTOC(window._ffReaderState.sid);};
window.ffReaderOpenSettings=function(){
    var m=document.getElementById('ff-reader-settings-mask'),s=document.getElementById('ff-reader-settings');
    if(m)m.classList.add('show');if(s)s.classList.add('show');
};
window.ffReaderCloseSettings=function(){
    var m=document.getElementById('ff-reader-settings-mask'),s=document.getElementById('ff-reader-settings');
    if(m)m.classList.remove('show');if(s)s.classList.remove('show');
};
window.ffReaderFontSize=function(delta){
    var st=window._ffReaderState;st.fontSize=Math.max(12,Math.min(30,st.fontSize+delta));
    var el=document.getElementById('ff-reader-text'),fs=document.getElementById('ff-reader-fs');
    if(el)el.style.fontSize=st.fontSize+'px';if(fs)fs.textContent=st.fontSize;
};
window.ffReaderBg=function(theme){
    var st=window._ffReaderState;st.bgTheme=theme;
    var el=document.getElementById('ff-reader-content');if(!el)return;
    el.className='ff-reader-content theme-'+theme;
    document.querySelectorAll('.ff-reader-bg-btn').forEach(function(b){b.classList.remove('active');});
    event.target.classList.add('active');
    if(theme==='dark'){st.fontColor='#c8c8c8';}
    var t=document.getElementById('ff-reader-text'),tt=document.querySelector('.ff-reader-chapter-title');
    if(t)t.style.color=st.fontColor;if(tt)tt.style.color=st.fontColor;
};
window.ffReaderColor=function(color){
    var st=window._ffReaderState;st.fontColor=color;
    var t=document.getElementById('ff-reader-text'),tt=document.querySelector('.ff-reader-chapter-title');
    if(t)t.style.color=color;if(tt)tt.style.color=color;
    document.querySelectorAll('.ff-reader-color-btn').forEach(function(b){b.classList.remove('active');});
    event.target.classList.add('active');
};
window.ffReaderToggleNight=function(){
    var st=window._ffReaderState;
    if(st.bgTheme==='dark'){ffReaderBg('default');st.fontColor='#333';}
    else{ffReaderBg('dark');st.fontColor='#c8c8c8';}
    var t=document.getElementById('ff-reader-text'),tt=document.querySelector('.ff-reader-chapter-title');
    if(t)t.style.color=st.fontColor;if(tt)tt.style.color=st.fontColor;
};

// === TABLE OF CONTENTS ===
window.ffOpenTOC=function(sid){
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    var chapters=window._ffParseChapters(s.content);
    var ci=window._ffCurrentChapter||0;
    var h='';
    for(var i=0;i<chapters.length;i++){
        var wc=chapters[i].content.length;
        h+='<div class="ff-toc-item'+(i===ci?' active':'')+'" style="display:flex;align-items:center;gap:6px;">'
            +'<div style="flex:1;min-width:0;cursor:pointer" onclick="document.getElementById(\'ff-toc-overlay\').remove();ffReaderGo('+i+')">'
            +'<span class="ff-toc-num">'+(i+1)+'</span>'
            +'<span class="ff-toc-title">'+escapeHtml(chapters[i].title)+'</span>'
            +'<span class="ff-toc-wc">'+wc+'字</span>'
            +'</div>'
            +'<div onclick="event.stopPropagation()" style="display:flex;gap:4px;flex-shrink:0">'
            +'<span onclick="document.getElementById(\'ff-toc-overlay\').remove();ffRerollChapter(\''+sid+'\','+i+')" style="color:#3498db;font-size:13px;padding:4px 6px;cursor:pointer;border-radius:4px;background:#f0f7ff" title="重新生成"><i class="fas fa-sync-alt"></i></span>'
            +(chapters.length>1?'<span onclick="document.getElementById(\'ff-toc-overlay\').remove();ffDeleteChapter(\''+sid+'\','+i+')" style="color:#e74c3c;font-size:13px;padding:4px 6px;cursor:pointer;border-radius:4px;background:#fff5f5" title="删除此章"><i class="fas fa-trash-alt"></i></span>':'')
            +'</div></div>';
    }
    var d=document.createElement('div');d.id='ff-toc-overlay';d.className='ff-modal-wrap';
    d.innerHTML='<div class="modal-overlay" onclick="this.parentElement.remove()"></div>'
        +'<div class="modal-box ff-toc-modal">'
        +'<div class="ff-toc-header"><span>📖 目录 ('+chapters.length+'章)</span><span onclick="document.getElementById(\'ff-toc-overlay\').remove()" style="font-size:22px;color:#999;cursor:pointer;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#f0f0f0">×</span></div>'
        +'<div class="ff-toc-list">'+h+'</div></div>';
    document.body.appendChild(d);
};

// === 重建章节内容（从chapters数组拼回content字符串） ===
window._ffRebuildContent=function(chapters){
    return chapters.map(function(ch){return ch.title+'\n'+ch.content;}).join('\n\n');
};

// === 删除单章 ===
window.ffDeleteChapter=function(sid,ci){
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    var chapters=window._ffParseChapters(s.content);
    if(chapters.length<=1)return toast('只剩一章，无法删除');
    if(!confirm('确定删除「'+chapters[ci].title+'」？删除后不可恢复。'))return;
    chapters.splice(ci,1);
    s.content=window._ffRebuildContent(chapters);
    s.wordCount=s.content.length;save();
    toast('已删除');
    // 如果删除的是当前章或之后的章，调整阅读位置
    var newCi=Math.min(ci,chapters.length-1);
    ffStartReader(sid,newCi);
};

// === 重roll单章（AI重新生成） ===
window._ffRerollLock=false;
window.ffRerollChapter=async function(sid,ci){
    if(window._ffRerollLock)return toast('正在重新生成中，请稍候...');
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    if(!store.system.key)return toast('请先配置API Key');
    var chapters=window._ffParseChapters(s.content);
    if(ci<0||ci>=chapters.length)return;
    var oldTitle=chapters[ci].title;
    if(!confirm('确定重新生成「'+oldTitle+'」？当前内容将被替换。'))return;
    window._ffRerollLock=true;
    toast('正在重新生成「'+oldTitle+'」...');
    try{
        var storyCtx=window._ffBuildStoryContext(s);
        // [FIX-上下文] 重新生成时：前面各章给600字摘要（前300+后300），紧邻的前一章给完整内容
        var prevSummary='';
        for(var i=0;i<ci;i++){
            var prevCh=chapters[i];
            var prevContent=prevCh.content||'';
            if(i===ci-1){
                // 紧邻的前一章：给完整内容（最多3000字），确保剧情衔接
                prevSummary+='\n【第'+(i+1)+'章 '+prevCh.title+' 完整内容】：\n'+prevContent.substring(Math.max(0,prevContent.length-3000))+'\n';
            }else{
                // 更早的章节：给600字摘要（前300+后300）
                var front=prevContent.substring(0,300);
                var back=prevContent.length>600?prevContent.substring(prevContent.length-300):'';
                prevSummary+=(i+1)+'. '+prevCh.title+'：'+front+(back?'……（中间省略）……'+back:'')+'...\n';
            }
        }
        // [FIX-上下文] 提取前文环境设定
        var envSettings=window._ffExtractSettings(s.content);
        var envCtx=envSettings?'\n【重要！前文已确立的环境/场景设定（重新生成时必须保持一致）】：\n'+envSettings+'\n':'';
        var nextSummary='';
        if(ci<chapters.length-1){
            var nextCh=chapters[ci+1];
            nextSummary='\n下一章概要（重新生成的内容需要能衔接到这里）：'+nextCh.title+'：'+nextCh.content.substring(0,400)+'...';
        }
        var chNum=ci+1;
        // [FIX-上下文] 被替换章节的原始内容也传入，让AI知道原来写了什么
        var origContent=chapters[ci].content||'';
        var origHint=origContent?'\n【被替换章节的原始剧情概要（供参考，重新生成时应覆盖相同的剧情节点，不要跳过）】：\n'+origContent.substring(0,800)+'...\n':'';
        var d=await window._ffApiCall([
            {role:'system',content:'你是同人文作者。重新生成第'+chNum+'章。\n\n'+storyCtx+envCtx+(prevSummary?'\n前文各章内容：\n'+prevSummary:'')+origHint+nextSummary+'\n\n要求：\n1. 以"第'+_numToChinese(chNum)+'章 [章节标题]"开头\n2. 字数1200-2500字\n3. 【关键】必须承接前一章的剧情结尾，从前一章结束的地方自然展开，不要跳过任何剧情节点\n4. 保持前文已描写的环境、场景、物品等设定不变\n5. 保持人物性格和风格一致\n6. 只输出新章节内容'+(s.userReq?'\n7. 必须严格遵守用户的创作要求':'')},
            {role:'user',content:'请重新生成第'+chNum+'章（至少1200字），注意从前一章结尾处自然衔接，不要跳过剧情：'}
        ],0.85);
        var t=(d.choices[0].message.content||'').trim();
        if(window._ffSanitizeContent)t=window._ffSanitizeContent(t);
        // 解析AI返回的标题和内容
        var titleMatch=t.match(/^((?:第[一二三四五六七八九十百千\d]+章|Chapter\s*\d+|【第[一二三四五六七八九十百千\d]+章[^】]*】)[^\n]*)/i);
        if(titleMatch){
            chapters[ci].title=titleMatch[1].trim();
            chapters[ci].content=t.substring(titleMatch[0].length).trim();
        }else{
            chapters[ci].content=t;
        }
        s.content=window._ffRebuildContent(chapters);
        s.wordCount=s.content.length;save();
        toast('第'+chNum+'章已重新生成');
        ffStartReader(sid,ci);
    }catch(e){toast('重新生成失败: '+e.message);}finally{window._ffRerollLock=false;}
};

// === 构建故事完整上下文（包含摘要、CP人设、前文关键信息） ===
// [FIX-上下文] 从章节内容中提取关键设定（环境描写、场景锚点等）
// [FIX-续写慢] 添加缓存+只扫描最后8000字，避免长文全文扫描导致卡顿
window._ffExtractSettingsCache={hash:'',result:''};
window._ffExtractSettings=function(text){
    if(!text)return '';
    // [FIX-续写慢] 只扫描最后8000字，前面的环境设定大概率已被后文覆盖
    var scanText=text.length>8000?text.substring(text.length-8000):text;
    // [FIX-续写慢] 简单hash缓存，相同内容不重复扫描
    var hash=scanText.length+'_'+scanText.substring(0,50)+scanText.substring(scanText.length-50);
    if(window._ffExtractSettingsCache.hash===hash)return window._ffExtractSettingsCache.result;
    var settings=[];
    // [FIX-上下文v2] 增加剧情关键词，不仅提取环境还提取关键事件/关系变化
    var envKeywords=['房间','卧室','客厅','厨房','阳台','书房','浴室','家里','屋子','公寓','别墅','宿舍','办公室','布置','装修','摆设','窗户','沙发','书桌','衣柜','床','墙上','墙壁','地板','天花板','灯','窗帘','地毯','花瓶','照片','海报','镜子'];
    var plotKeywords=['告白','分手','发现','秘密','真相','约定','承诺','戒指','项链','钥匙','信','日记','手机','照片','生日','纪念日','搬家','离开','回来','医院','受伤','道歉','原谅','表白','牵手','拥抱','亲吻','争吵','误会','哭','眼泪','死','病','怀孕','订婚','结婚','毕业','辞职','入职'];
    var allKeywords=envKeywords.concat(plotKeywords);
    var lines=scanText.split(/[。！？\n]/);
    for(var i=0;i<lines.length;i++){
        var line=lines[i].trim();
        if(line.length<8||line.length>200)continue;
        for(var j=0;j<allKeywords.length;j++){
            if(line.indexOf(allKeywords[j])>-1&&line.length>=10){
                settings.push(line);
                break;
            }
        }
        if(settings.length>=15)break;
    }
    var unique=[];var seen={};
    for(var k=0;k<settings.length;k++){
        var key=settings[k].substring(0,20);
        if(!seen[key]){seen[key]=true;unique.push(settings[k]);}
    }
    var result=unique.slice(0,12).join('。');
    window._ffExtractSettingsCache={hash:hash,result:result};
    return result;
};
window._ffBuildStoryContext=function(s){
    var ctx='';
    // 1. 故事基本信息
    ctx+='【故事标题】：'+escapeHtml(s.title||'')+'\\n';
    if(s.genre)ctx+='【类型】：'+s.genre+'\\n';
    if(s.summary)ctx+='【简介】：'+s.summary+'\\n';
    if(s.tags&&s.tags.length)ctx+='【标签】：'+s.tags.join('、')+'\\n';
    // 2. CP角色人设信息
    if(s.cpId||s.cpName){
        var cp=s.cpId?store.fanfic.cps.find(function(c){return c.id===s.cpId;}):null;
        if(cp){
            ctx+='【CP】：'+cp.cpName+'\\n';
            ctx+='【角色1】：'+cp.char1.name+'('+cp.char1.position+','+cp.char1.gender+','+cp.char1.traits+')';
            if(cp.char1.contactId){var c1=(store.contacts||[]).find(function(x){return x.id===cp.char1.contactId;});if(c1&&c1.persona)ctx+='\\n  人设:'+c1.persona;}
            ctx+='\\n';
            ctx+='【角色2】：'+cp.char2.name+'('+cp.char2.position+','+cp.char2.gender+','+cp.char2.traits+')';
            var _c2HasPersona=false;
            if(cp.char2.contactId){var c2=(store.contacts||[]).find(function(x){return x.id===cp.char2.contactId;});if(c2&&c2.persona){ctx+='\\n  人设:'+c2.persona;_c2HasPersona=true;}}
            if(!_c2HasPersona&&cp.char2.personaId){var _p2=(store.personas||[]).find(function(x){return x.id===cp.char2.personaId;});if(_p2&&_p2.desc)ctx+='\\n  人设:'+_p2.desc;}
            ctx+='\\n';
            if(cp.worldviews&&cp.worldviews.length)ctx+='【世界观】：'+cp.worldviews.map(function(w){return w.name+':'+w.description;}).join('\\n')+'\\n';
        }else if(s.cpName){
            ctx+='【CP】：'+s.cpName+'\\n';
        }
    }
    // 3. 用户创作要求
    if(s.userReq)ctx+='【用户的创作要求（必须严格遵守）】：'+s.userReq+'\\n';
    // 4. [FIX-上下文] 从全文提取关键环境/场景设定，防止续写丢失
    var allContent=s.content||'';
    var extractedSettings=window._ffExtractSettings(allContent);
    if(extractedSettings)ctx+='\\n【重要！前文已确立的环境/场景设定（续写必须保持一致）】：\\n'+extractedSettings+'\\n';
    // 5. [FIX-上下文] 构建各章摘要+最后章节全文，摘要从200字提升到600字
    var chapters=window._ffParseChapters(s.content);
    if(chapters.length>1){
        ctx+='\\n【前文各章概要】：\\n';
        // [FIX-上下文] 根据章节数量动态调整摘要长度：章节少时给更多，章节多时适当压缩
        var summaryLen=chapters.length<=3?300:chapters.length<=6?200:150;
        for(var i=0;i<chapters.length-1;i++){
            var ch=chapters[i];
            var chContent=ch.content||'';
            // [FIX-上下文] 取前半段+后半段，确保开头和结尾的剧情都能保留
            var halfLen=Math.floor(summaryLen/2);
            var frontPart=chContent.substring(0,halfLen);
            var endPart=chContent.length>summaryLen?chContent.substring(Math.max(halfLen,chContent.length-halfLen)):'';
            var chSummary=frontPart+(endPart?'……（中间省略）……'+endPart:'');
            ctx+=(i+1)+'. '+ch.title+'：'+chSummary+'\\n';
        }
        // [FIX-上下文v2] 最近一章给更多内容（实际给3000字，与注释一致）
        var lastCh=chapters[chapters.length-1];
        ctx+='\\n【最近一章完整内容（第'+chapters.length+'章 '+lastCh.title+'）】：\\n';
        ctx+=lastCh.content.substring(Math.max(0,lastCh.content.length-3000))+'\\n';
        // [FIX-上下文v2] 提取最后一章结尾的关键场景/事件作为续写锚点
        var lastLines=lastCh.content.trim().split(/[。！？\n]/).filter(function(l){return l.trim().length>5;});
        if(lastLines.length>=2){
            ctx+='\\n【上一章结尾关键信息（续写必须从此处自然衔接）】：\\n';
            ctx+=lastLines.slice(-3).join('。')+'\\n';
        }
    }else if(chapters.length===1){
        ctx+='\\n【已有正文内容】：\\n'+s.content.substring(Math.max(0,s.content.length-3000))+'\\n';
    }
    return ctx;
};

// === CONTINUE STORY AS NEW CHAPTER ===
// [FIX] 防重复续写锁
// [FIX] 生成中loading弹窗
function _ffShowGenOverlay(title,desc){
    _ffHideGenOverlay();
    var d=document.createElement('div');d.id='ff-gen-overlay';
    d.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);';
    d.innerHTML='<div style="background:#fff;border:1px solid #333;border-radius:14px;padding:24px 32px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.15);min-width:180px"><div style="width:36px;height:36px;border:3px solid #e0e0e0;border-top-color:#333;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px"></div><div style="font-size:15px;font-weight:600;color:#333;margin-bottom:4px">'+(title||'生成中...')+'</div><div style="font-size:12px;color:#999">'+(desc||'请稍候')+'</div></div>';
    document.body.appendChild(d);
}
function _ffHideGenOverlay(){var e=document.getElementById('ff-gen-overlay');if(e)e.remove();}
window._ffShowGenOverlay=_ffShowGenOverlay;window._ffHideGenOverlay=_ffHideGenOverlay;

// [FIX-续写死锁] 添加锁超时自动释放机制（180秒）
window._ffContinueLock=false;
window._ffContinueLockTimer=null;
function _ffSetContinueLock(val){
    window._ffContinueLock=val;
    // [MOD] 不做超时限制
}
window._ffSetContinueLock=_ffSetContinueLock;
window.ffContinueStoryChapter=async function(sid){
    // [FIX] 防止重复点击触发多次续写
    if(window._ffContinueLock){return toast('正在续写中，请稍候...');}
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    if(!store.system.key)return toast('请先配置API Key');
    var chapters=window._ffParseChapters(s.content);
    var nextNum=chapters.length+1;
    // Use the enhanced pickFlow if available
    if(typeof window.ffContinueStory==='function'){
        window.ffContinueStory(sid);
        return;
    }
    _ffSetContinueLock(true);
    toast('正在生成第'+nextNum+'章...');
    try{
        var storyCtx=window._ffBuildStoryContext(s);
        // [FIX-字数+乱码] 使用高max_tokens调用，强化字数要求
        // [FIX-上下文] 续写prompt增加场景延续要求
        var d=await window._ffApiCall([{role:'system',content:'你是同人文作者。续写下一章节。\n\n'+storyCtx+'\n要求：\n1. 以"第'+_numToChinese(nextNum)+'章 [章节标题]"开头\n2. 【字数硬性要求】续写必须达到1200字以上，范围1200-2500字，严禁少于1200字\n3. 【关键】必须从上一章结尾处自然衔接，不要跳过任何剧情节点\n4. 前文中描写过的环境、房间布置、物品摆设等设定必须保持一致，不要遗忘\n5. 保持人物性格、关系和风格一致，不要出现与前文矛盾的内容\n6. 只输出新章节内容（包含章节标题行）'+(s.userReq?'\n7. 必须严格遵守用户的创作要求！':'')},{role:'user',content:'请续写第'+nextNum+'章（至少1200字），从上一章结尾自然衔接：'}],0.85);
        var t=(d.choices[0].message.content||'').trim();
        // [FIX-乱码] 清洗续写内容
        t=window._ffSanitizeContent(t);
        s.content+='\n\n'+t;s.wordCount=s.content.length;s.serialStatus='ongoing';save();
        var newChapters=window._ffParseChapters(s.content);
        ffStartReader(sid,newChapters.length-1);toast('第'+nextNum+'章已生成');
    }catch(e){toast('续写失败: '+e.message);}finally{_ffSetContinueLock(false);}
};
function _numToChinese(n){var c=['零','一','二','三','四','五','六','七','八','九','十'];if(n<=10)return c[n];if(n<20)return'十'+c[n-10];if(n<100)return c[Math.floor(n/10)]+'十'+(n%10?c[n%10]:'');return String(n);}
window._numToChinese=_numToChinese;
window.closeFanficRead=function(){document.getElementById('layer-fanfic-read').classList.remove('show');renderFanficHome();};
window.ffLikeStory=function(sid){
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;if(!s.likes)s.likes=[];
    var i=s.likes.indexOf('me');if(i>-1)s.likes.splice(i,1);else s.likes.push('me');save();openFanficRead(sid);
};
window.ffAddComment=function(sid){
    showPromptModal('写下你的评论:','',{multiline:true}).then(function(t){if(!t||!t.trim())return;
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;if(!s.comments)s.comments=[];
    s.comments.push({user:store.user?.name||'我',text:t.trim(),time:Date.now()});save();openFanficRead(sid);toast('评论成功');
    });
};
// [FIX] 旧版ffContinueStory已移除，统一使用下方增强版（带文风/剧情/视角选择）
// 此处保留空位，避免行号偏移

// === WRITE ===
window.openFanficWriteNew=function(){
    init();var ly=document.getElementById('layer-fanfic-write');ly.classList.add('show');
    var gOpts=window._ffGenres.filter(function(g){return g!=='全部';}).map(function(g){return '<option value="'+g+'">'+g+'</option>';}).join('');
    ly.innerHTML='<div class="ff-write-app"><div class="ff-write-header"><div class="ff-write-back" onclick="closeFanficWrite()"><i class="fas fa-chevron-left"></i></div><div class="ff-write-title">创作</div><div class="ff-write-actions"><button class="ff-save-draft" onclick="ffSaveDraft()"><i class="fas fa-save"></i> 存草稿</button><button class="ff-publish-btn" onclick="ffPublishStory()"><i class="fas fa-paper-plane"></i> 发布</button></div></div>'+
    '<div class="ff-write-body"><div class="ff-write-field"><label>标题</label><input type="text" id="ff-write-title" placeholder="给作品起个名字" maxlength="30"></div>'+
    '<div class="ff-write-field"><label>类型</label><select id="ff-write-genre">'+gOpts+'</select></div>'+
    '<div class="ff-write-field"><label>简介</label><input type="text" id="ff-write-summary" placeholder="一句话简介" maxlength="60"></div>'+
    '<div class="ff-write-field ff-write-content-field"><label>正文 <span id="ff-write-wc">0字</span></label><textarea id="ff-write-content" placeholder="开始你的创作..." oninput="document.getElementById(\'ff-write-wc\').textContent=this.value.length+\'字\'"></textarea></div>'+
    '<div class="ff-write-ai">'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="ff-ai-assist" onclick="ffAIAssist()" style="flex:1;min-width:120px"><i class="fas fa-magic"></i> AI续写（文风+剧情）</button>'+
    '<button onclick="ffOpenStyleManager()" style="flex:0 0 auto;padding:8px 14px;border:1px solid #e0e0e0;background:#fff;border-radius:10px;font-size:13px;cursor:pointer;color:#667eea"><i class="fas fa-feather-alt"></i> 文风管理</button>'+
    '</div>'+
    '<div style="font-size:11px;color:#aaa;margin-top:6px;text-align:center">点击AI续写后可选择文风和剧情走向</div>'+
    '</div></div></div>';
};
window.openFanficEditDraft=function(did){
    init();var dr=store.fanfic.drafts.find(function(d){return d.id===did;});if(!dr)return toast('草稿不存在');
    openFanficWriteNew();
    setTimeout(function(){
        document.getElementById('ff-write-title').value=dr.title||'';
        document.getElementById('ff-write-genre').value=dr.genre||'现代言情';
        document.getElementById('ff-write-summary').value=dr.summary||'';
        document.getElementById('ff-write-content').value=dr.content||'';
        document.getElementById('ff-write-wc').textContent=(dr.content||'').length+'字';
        document.getElementById('ff-write-title').dataset.draftId=did;
    },50);
};
window.closeFanficWrite=function(){document.getElementById('layer-fanfic-write').classList.remove('show');renderFanficHome();};
window.ffSaveDraft=function(){
    init();var ti=document.getElementById('ff-write-title').value.trim(),ge=document.getElementById('ff-write-genre').value,su=document.getElementById('ff-write-summary').value.trim(),co=document.getElementById('ff-write-content').value;
    var did=document.getElementById('ff-write-title').dataset.draftId;
    if(did){var dr=store.fanfic.drafts.find(function(d){return d.id===did;});if(dr){dr.title=ti;dr.genre=ge;dr.summary=su;dr.content=co;dr.time=Date.now();}}
    else{store.fanfic.drafts.push({id:'draft_'+Date.now(),title:ti||'未命名',genre:ge,summary:su,content:co,time:Date.now()});}
    save();toast('已保存草稿');
};
window.ffPublishStory=function(){
    init();var ti=document.getElementById('ff-write-title').value.trim(),ge=document.getElementById('ff-write-genre').value,su=document.getElementById('ff-write-summary').value.trim(),co=document.getElementById('ff-write-content').value;
    if(!ti)return toast('请输入标题');if(!co||co.length<10)return toast('正文至少10字');
    var did=document.getElementById('ff-write-title').dataset.draftId;
    if(did)store.fanfic.drafts=store.fanfic.drafts.filter(function(d){return d.id!==did;});
    var eng=window._ffGenEng([],ge);
    var storyId='ff_'+Date.now();
    store.fanfic.stories.push({id:storyId,title:ti,summary:su,content:co,genre:ge,author:store.fanfic.settings.penName||store.user?.name||'匿名',coverColor:rc(),wordCount:co.length,time:Date.now(),likes:eng.likes,comments:[],views:eng.views,status:'published',serialStatus:'completed',isMe:true,tags:[]});
    save();toast('发布成功！正在生成AI标签和评论...');closeFanficWrite();

    // 异步生成AI智能标签+评论（一次性生成，确保标签和评论与内容匹配）
    setTimeout(async function(){
        try{
            var s=store.fanfic.stories.find(function(x){return x.id===storyId;});
            if(!s)return;
            if(store.system&&store.system.key){
                var contentSnippet=(co||'').substring(0,400);
                var aiPrompt='你是同人文读者社区。请根据以下小说信息，同时生成匹配的标签和读者评论。\n'+
                    '标题：'+ti+'\n'+
                    '类型：'+(ge||'未分类')+'\n'+
                    '简介：'+(su||'无')+'\n'+
                    '正文片段：'+contentSnippet+'\n\n'+
                    '要求：\n'+
                    '1. 生成3-5个标签（如：甜宠、HE、校园、双向暗恋等，要与文章实际内容和风格匹配）\n'+
                    '2. 生成5-8条读者评论：\n'+
                    '   - 每条评论必须与小说的具体内容相关！要提到文中的情节、角色、场景或感受\n'+
                    '   - 如果是甜文就说甜到了，虐文就说被虐哭了，悬疑就说好紧张等\n'+
                    '   - 评论长度有变化：有的短（5-15字），有的长（20-50字分析剧情）\n'+
                    '   - 部分评论之间要有互动讨论\n'+
                    '   - 风格像真实读者：可以用颜文字、emoji、网络用语\n'+
                    'JSON输出：{"tags":["标签1","标签2"],"comments":[{"user":"读者网名","text":"评论内容"}]}';
                try{
                    var data=await API.chatCompletion([{role:'system',content:aiPrompt},{role:'user',content:'请生成标签和评论'}]);
                    var reply=(data.choices[0].message.content||'').trim();
                    var jsonMatch=reply.match(/\{[\s\S]*\}/);
                    if(jsonMatch){
                        var metaObj=JSON.parse(jsonMatch[0]);
                        // 更新标签
                        if(metaObj.tags&&Array.isArray(metaObj.tags)&&metaObj.tags.length>0){
                            s.tags=metaObj.tags;
                        }
                        // 更新评论
                        if(metaObj.comments&&Array.isArray(metaObj.comments)){
                            var _VA3=window._ffVAuthors||[];
                            if(!s.comments)s.comments=[];
                            for(var ci=0;ci<metaObj.comments.length;ci++){
                                s.comments.push({
                                    user:metaObj.comments[ci].user||(_VA3.length>0?_VA3[Math.floor(Math.random()*_VA3.length)].name:'读者'+Math.floor(Math.random()*100)),
                                    text:(metaObj.comments[ci].text||metaObj.comments[ci].content||'好看！').substring(0,100),
                                    time:Date.now()-Math.floor(Math.random()*86400000*3)
                                });
                            }
                        }
                        // 额外增加一些阅读量和点赞
                        s.views=(s.views||0)+Math.floor(Math.random()*200)+50;
                        var extraLikes=Math.floor(Math.random()*20)+5;
                        if(!s.likes)s.likes=[];
                        for(var li=0;li<extraLikes;li++)s.likes.push('ai_reader_'+Date.now()+'_'+li);
                        if(typeof save==='function')save();
                        toast('已生成标签和 '+(metaObj.comments?metaObj.comments.length:0)+' 条AI智能评论 💬');
                        return;
                    }
                }catch(aiErr){console.error('AI标签评论生成失败:',aiErr);}
            }
            // 回退：用标签感知的本地评论
            var fallbackEng=window._ffGenEng(s.tags||[],ge);
            if(!s.comments)s.comments=[];
            var fc=fallbackEng.comments||[];
            for(var fi=0;fi<fc.length;fi++)s.comments.push(fc[fi]);
            s.views=(s.views||0)+Math.floor(Math.random()*100)+20;
            if(typeof save==='function')save();
            toast('已生成评论 💬');
        }catch(e){console.error('评论生成失败:',e);}
    },1500);
};
window.deleteFanficDraft=function(did){
    if(!confirm('删除此草稿？'))return;
    store.fanfic.drafts=store.fanfic.drafts.filter(function(d){return d.id!==did;});save();renderFanficHome();toast('已删除');
};
window.deleteFanficStory=function(sid){
    if(!confirm('确定删除此作品？删除后不可恢复。'))return;
    store.fanfic.stories=store.fanfic.stories.filter(function(s){return s.id!==sid;});
    store.fanfic.bookshelf=(store.fanfic.bookshelf||[]).filter(function(id){return id!==sid;});
    save();renderFanficHome();toast('作品已删除');
};
// [FIX] 旧版ffAIAssist已移除，统一使用下方增强版（带文风/剧情/视角选择）

// === AVATAR CHANGE (local + URL) ===
window.ffChangeAvatar=function(){
    init();
    var d=document.createElement('div');d.id='ff-avatar-menu';d.className='ff-modal-wrap';
    d.innerHTML='<div class="modal-overlay" onclick="document.getElementById(\'ff-avatar-menu\').remove()"></div>'+
    '<div class="modal-box" style="max-width:320px;border-radius:4px;"><div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;">修改头像<span onclick="document.getElementById(\'ff-avatar-menu\').remove()" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:#f0f0f0;cursor:pointer;font-size:18px;color:#666">×</span></div><div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">'+
    '<button onclick="ffAvatarFromLocal()" style="padding:12px;border:1px solid #ddd;border-radius:10px;background:#f9f9f9;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;"><i class="fas fa-image" style="color:#07c160;"></i> 本地上传</button>'+
    '<button onclick="ffAvatarFromURL()" style="padding:12px;border:1px solid #ddd;border-radius:10px;background:#f9f9f9;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;"><i class="fas fa-link" style="color:#576b95;"></i> URL链接</button>'+
    (store.fanfic.settings.avatar?'<button onclick="ffAvatarClear()" style="padding:12px;border:1px solid #fdd;border-radius:10px;background:#fff5f5;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:#e74c3c;"><i class="fas fa-trash-alt"></i> 清除头像</button>':'')+
    '</div></div>';
    document.body.appendChild(d);
};
window.ffAvatarFromLocal=function(){
    var el=document.getElementById('ff-avatar-menu');if(el)el.remove();
    var inp=document.createElement('input');inp.type='file';inp.accept='image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.heic,.heif';
    // [FIX-Edge上传退出] 挂载到DOM防止Edge丢失焦点
    inp.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
    document.body.appendChild(inp);
    inp.onchange=function(){
        if(inp.parentNode)inp.parentNode.removeChild(inp);
        if(!inp.files||!inp.files[0])return;
        var reader=new FileReader();
        reader.onload=function(e){
            store.fanfic.settings.avatar=e.target.result;
            save();renderFanficHome();toast('头像已更新');
        };
        reader.readAsDataURL(inp.files[0]);
    };
    setTimeout(function(){inp.click();},50);
};
window.ffAvatarFromURL=function(){
    var el=document.getElementById('ff-avatar-menu');if(el)el.remove();
    showPromptModal('请输入头像图片URL:',store.fanfic.settings.avatar||'').then(function(url){
    if(url===null)return;
    url=url.trim();
    if(!url){toast('URL不能为空');return;}
    // Validate URL format
    if(!/^https?:\/\/.+/i.test(url)){toast('请输入有效的URL（以http://或https://开头）');return;}
    // Test if image loads
    var img=new Image();
    img.onload=function(){
        store.fanfic.settings.avatar=url;
        save();renderFanficHome();toast('头像已更新 ✅');
    };
    img.onerror=function(){
        // Still save even if can't load (might be CORS issue)
        if(confirm('图片加载失败，可能是跨域限制。仍然使用此URL？')){
            store.fanfic.settings.avatar=url;
            save();renderFanficHome();toast('头像URL已保存');
        }
    };
    img.src=url;
    });
};
window.ffAvatarClear=function(){
    var el=document.getElementById('ff-avatar-menu');if(el)el.remove();
    store.fanfic.settings.avatar='';
    save();renderFanficHome();toast('头像已清除');
};

// === SETTINGS ===
window.openFanficSettings=function(){
    init();var s=store.fanfic.settings;
    var avPrev=s.avatar?'<img src="'+escapeHtml(s.avatar)+'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #eee;" onerror="this.style.display=\'none\'">':'<div style="width:60px;height:60px;border-radius:50%;background:#2BAE85;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;">'+(s.penName||'匿').charAt(0)+'</div>';
    // [NEW] 预设提示词列表
    var prompts=store.fanfic.customPrompts||[];
    var promptsHtml='<div class="ff-section-title" style="color:#2BAE85;margin-top:16px;margin-bottom:8px;"><i class="fas fa-magic" style="margin-right:6px;"></i>预设提示词</div>';
    promptsHtml+='<div style="font-size:12px;color:#999;margin-bottom:8px;">创建常用的创作要求模板，写作时可一键选用</div>';
    if(prompts.length>0){
        promptsHtml+='<div id="ff-preset-list" style="max-height:200px;overflow-y:auto;">';
        for(var pi=0;pi<prompts.length;pi++){
            var p=prompts[pi];
            var defBadge=p.isDefault?'<span style="font-size:10px;color:#fff;background:#2BAE85;padding:1px 6px;border-radius:4px;margin-left:6px;">默认</span>':'';
            promptsHtml+='<div style="display:flex;align-items:center;gap:8px;background:#f9f9f9;border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid '+(p.isDefault?'#2BAE85':'#eee')+';">'
                +'<div style="flex:1;min-width:0;">'
                +'<div style="font-size:13px;font-weight:600;color:#333;">'+escapeHtml(p.name||'未命名')+defBadge+'</div>'
                +'<div style="font-size:11px;color:#999;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeHtml((p.content||'').substring(0,60))+'</div>'
                +'</div>'
                +'<div style="display:flex;gap:4px;flex-shrink:0;">'
                +(p.isDefault?'':'<button onclick="ffSetDefaultPrompt('+pi+')" style="font-size:11px;padding:3px 8px;border:1px solid #2BAE85;background:#fff;color:#2BAE85;border-radius:4px;cursor:pointer;" title="设为默认">⭐</button>')
                +'<button onclick="ffEditPrompt('+pi+')" style="font-size:11px;padding:3px 8px;border:1px solid #1890ff;background:#fff;color:#1890ff;border-radius:4px;cursor:pointer;" title="编辑">✏️</button>'
                +'<button onclick="ffDeletePrompt('+pi+')" style="font-size:11px;padding:3px 8px;border:1px solid #fa5151;background:#fff;color:#fa5151;border-radius:4px;cursor:pointer;" title="删除">🗑️</button>'
                +'</div></div>';
        }
        promptsHtml+='</div>';
    }else{
        promptsHtml+='<div style="text-align:center;padding:16px;color:#ccc;font-size:13px;">暂无预设提示词</div>';
    }
    promptsHtml+='<button onclick="ffAddPrompt()" style="width:100%;padding:10px;border:1px dashed #2BAE85;background:#f0faf5;color:#2BAE85;border-radius:8px;font-size:13px;cursor:pointer;margin-top:6px;"><i class="fas fa-plus" style="margin-right:6px;"></i>新增预设提示词</button>';

    var h='<div class="modal-overlay" onclick="closeFanficSettings()"></div><div class="modal-box ff-settings-modal" style="position:relative;"><div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;"><span>同人文设置</span><span class="modal-close" onclick="closeFanficSettings()" style="position:absolute;top:12px;right:12px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(0,0,0,0.06);cursor:pointer;font-size:18px;color:#666;z-index:1;">×</span></div><div class="modal-body">'+
    '<div style="text-align:center;margin-bottom:16px;"><div onclick="ffChangeAvatar()" style="display:inline-block;cursor:pointer;position:relative;">'+avPrev+'<div style="position:absolute;bottom:0;right:0;width:20px;height:20px;border-radius:50%;background:#07c160;display:flex;align-items:center;justify-content:center;"><i class="fas fa-camera" style="color:#fff;font-size:10px;"></i></div></div><div style="font-size:12px;color:#999;margin-top:6px;">点击修改头像</div></div>'+
    '<div class="ff-settings-field"><label>笔名</label><input type="text" id="ff-set-pen" value="'+escapeHtml(s.penName||'')+'" placeholder="你的笔名"></div>'+
    '<div class="ff-settings-field"><label>头像URL</label><div style="display:flex;gap:8px;"><input type="text" id="ff-set-avatar" value="'+escapeHtml(s.avatar||'')+'" placeholder="头像图片链接(可选)" style="flex:1;"><button onclick="ffAvatarFromLocal()" style="padding:6px 12px;border:1px solid #ddd;border-radius:6px;background:#f5f5f5;font-size:12px;white-space:nowrap;cursor:pointer;" title="本地上传"><i class="fas fa-upload"></i></button></div></div>'+
    promptsHtml+
    '<div class="ff-settings-actions" style="margin-top:16px;"><button onclick="saveFanficSettings()" class="ff-btn-save">保存</button><button onclick="closeFanficSettings()" class="ff-btn-cancel">取消</button></div>'+
    '<div class="ff-settings-danger"><div class="ff-section-title" style="color:#e74c3c">危险操作</div><button onclick="ffClearAllData()" class="ff-btn-danger">清除所有同人文数据</button></div>'+
    '</div></div>';
    var d=document.createElement('div');d.id='ff-settings-overlay';d.className='ff-modal-wrap';d.innerHTML=h;document.body.appendChild(d);
};
window.closeFanficSettings=function(){var el=document.getElementById('ff-settings-overlay');if(el)el.remove();};
window.saveFanficSettings=function(){
    store.fanfic.settings.penName=document.getElementById('ff-set-pen').value.trim();
    var avatarVal=document.getElementById('ff-set-avatar').value.trim();
    // If URL provided, validate and save
    if(avatarVal && !/^(data:|https?:\/\/)/i.test(avatarVal)){
        toast('头像URL格式无效，请输入http/https链接');return;
    }
    store.fanfic.settings.avatar=avatarVal;
    save();closeFanficSettings();renderFanficHome();toast('设置已保存');
};

// === 预设提示词管理 ===
window.ffAddPrompt=function(){
    _ffShowPromptEditor(-1);
};
window.ffEditPrompt=function(idx){
    _ffShowPromptEditor(idx);
};
window.ffDeletePrompt=function(idx){
    if(!confirm('确定删除这条预设提示词？'))return;
    var prompts=store.fanfic.customPrompts||[];
    prompts.splice(idx,1);
    save();closeFanficSettings();openFanficSettings();toast('已删除');
};
window.ffSetDefaultPrompt=function(idx){
    var prompts=store.fanfic.customPrompts||[];
    for(var i=0;i<prompts.length;i++)prompts[i].isDefault=false;
    if(prompts[idx])prompts[idx].isDefault=true;
    save();closeFanficSettings();openFanficSettings();toast('已设为默认');
};
function _ffShowPromptEditor(idx){
    var isEdit=idx>=0;
    var prompts=store.fanfic.customPrompts||[];
    var existing=isEdit?prompts[idx]:{name:'',content:'',isDefault:false};
    var overlay=document.createElement('div');
    overlay.id='ff-prompt-editor-overlay';
    overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML='<div style="background:#fff;border-radius:16px;width:90%;max-width:380px;padding:20px;">'
        +'<div style="font-size:16px;font-weight:600;margin-bottom:14px;">'+(isEdit?'✏️ 编辑预设提示词':'✨ 新增预设提示词')+'</div>'
        +'<div style="margin-bottom:10px;"><label style="font-size:13px;color:#666;display:block;margin-bottom:4px;">名称</label>'
        +'<input id="ff-prompt-name" type="text" value="'+escapeHtml(existing.name||'')+'" placeholder="例如：甜宠风格、虐心路线" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;"></div>'
        +'<div style="margin-bottom:10px;"><label style="font-size:13px;color:#666;display:block;margin-bottom:4px;">提示词内容</label>'
        +'<textarea id="ff-prompt-content" rows="6" placeholder="在这里填写创作要求，例如：\n• 写甜宠风格，多撒糖\n• 角色A暗恋角色B\n• 故事发生在校园\n• 要有误会和和好的情节\n\n支持变量：{char1} {char2} {cpName}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:13px;box-sizing:border-box;resize:vertical;">'+escapeHtml(existing.content||'')+'</textarea></div>'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">'
        +'<input type="checkbox" id="ff-prompt-default" '+(existing.isDefault?'checked':'')+' style="accent-color:#2BAE85;">'
        +'<label for="ff-prompt-default" style="font-size:13px;color:#666;">设为默认（写作时自动填入）</label></div>'
        +'<div style="display:flex;gap:8px;">'
        +'<button onclick="ffSavePromptEditor('+idx+')" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:8px;font-size:14px;cursor:pointer;">保存</button>'
        +'<button onclick="document.getElementById(\'ff-prompt-editor-overlay\').remove()" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;color:#666;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>'
        +'</div></div>';
    document.body.appendChild(overlay);
}
window.ffSavePromptEditor=function(idx){
    var name=(document.getElementById('ff-prompt-name').value||'').trim();
    var content=(document.getElementById('ff-prompt-content').value||'').trim();
    var isDefault=document.getElementById('ff-prompt-default').checked;
    if(!name){toast('请填写名称');return;}
    if(!content){toast('请填写提示词内容');return;}
    if(!store.fanfic.customPrompts)store.fanfic.customPrompts=[];
    var prompts=store.fanfic.customPrompts;
    if(isDefault){for(var i=0;i<prompts.length;i++)prompts[i].isDefault=false;}
    var obj={id:'fp_'+Date.now(),name:name,content:content,isDefault:isDefault};
    if(idx>=0&&prompts[idx]){
        obj.id=prompts[idx].id||obj.id;
        prompts[idx]=obj;
    }else{
        prompts.push(obj);
    }
    save();
    var editorEl=document.getElementById('ff-prompt-editor-overlay');
    if(editorEl)editorEl.remove();
    closeFanficSettings();openFanficSettings();
    toast(idx>=0?'已更新':'已添加');
};

window.ffClearAllData=function(){
    if(!confirm('确定清除所有同人文数据？此操作不可恢复！'))return;
    store.fanfic={cps:[],stories:[],bookshelf:[],settings:{penName:'',avatar:''},drafts:[],customPrompts:[]};
    save();closeFanficSettings();renderFanficHome();toast('数据已清除');
};
})();

// === SHOP FIXES & ENHANCEMENTS ===
(function(){
'use strict';

// ===== 1. Better product images per category (20 unique per category) =====
var SHOP_IMG_POOL = {
    '衣服': Array.from({length:20}, function(_,i){ return 'https://picsum.photos/seed/yancloth'+i+'/400/400'; }),
    '美妆': Array.from({length:20}, function(_,i){ return 'https://picsum.photos/seed/yanbeauty'+i+'/400/400'; }),
    '食品': Array.from({length:20}, function(_,i){ return 'https://picsum.photos/seed/yanfood'+i+'/400/400'; }),
    '鞋包': Array.from({length:20}, function(_,i){ return 'https://picsum.photos/seed/yanbag'+i+'/400/400'; })
};
window._shopGetImg = function(category){
    var pool = SHOP_IMG_POOL[category] || SHOP_IMG_POOL['衣服'];
    return pool[Math.floor(Math.random() * pool.length)];
};

// ===== 2. Fix shopDoSearch white screen =====
window.shopDoSearch = async function(){
    var input = document.getElementById('shop-search-input');
    var query = (input ? input.value : '').trim();
    if(!query){ window.shopRenderSearchResults(''); return; }

    // Ensure search panel visible
    ['home','cart','orders','me'].forEach(function(t){
        var el = document.getElementById('shop-tab-' + t);
        if(el) el.style.display = 'none';
    });
    var panel = document.getElementById('shop-search-panel');
    if(panel) panel.style.display = 'block';

    // Local filter first
    var localResults = (store.shopProducts || []).filter(function(p){
        var q = query.toLowerCase();
        return (p.name||'').toLowerCase().indexOf(q) !== -1 || (p.desc||'').toLowerCase().indexOf(q) !== -1 || (p.category||'').toLowerCase().indexOf(q) !== -1;
    });
    if(localResults.length > 0){
        window.shopRenderSearchResults(query);
        return;
    }

    // Show loading
    var container = document.getElementById('shop-search-results');
    if(container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#4facfe;"></i><p style="margin-top:8px;">正在搜索...</p></div>';

    var url = store.system && store.system.url;
    var key = store.system && store.system.key;
    if(!url || !key){
        if(container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-search" style="font-size:36px;color:#ddd;margin-bottom:12px;display:block;"></i><p>请先配置API后再搜索</p></div>';
        return;
    }

    try{
        var prompt = '用户搜索"'+query+'"，请生成6个与此搜索相关的商品，返回JSON数组，每个商品包含name(商品名，必须包含关键词"'+query+'")、price(价格数字)、desc(一句话描述)、category(类别，必须从以下选择：衣服、美妆、食品、鞋包)。只返回JSON数组，不要其他文字。不要用markdown代码块包裹。不要包含image字段。';
        var data = await API.chatCompletion([{role:'user',content:prompt}],{temperature:0.9});
        if(!data || !data.choices || !data.choices[0]) throw new Error('API返回格式异常');
        var text = (data.choices[0].message && data.choices[0].message.content) || '';
        text = text.replace(/```[\s\S]*?```/g,function(m){return m.replace(/^```(?:json|JSON)?\s*\n?/,'').replace(/\n?\s*```$/,'');});
        text = text.replace(/```(?:json|JSON)?\s*/gi,'').replace(/```\s*/g,'').trim();
        var match = text.match(/\[[\s\S]*?\](?=[^[\]]*$)/) || text.match(/\[[\s\S]*\]/);
        if(!match) throw new Error('未找到JSON数组');
        var items;
        try{ items = JSON.parse(match[0]); }catch(e){
            var fixed = match[0].replace(/,\s*([}\]])/g,'$1').replace(/'/g,'"');
            try{ items = JSON.parse(fixed); }catch(e2){ throw new Error('数据解析失败'); }
        }
        if(!Array.isArray(items) || items.length === 0) throw new Error('返回数据为空');
        var CATS = ['衣服','美妆','食品','鞋包'];
        var newProductIds = [];
        items.forEach(function(item){
            var cat = CATS.indexOf(item.category) !== -1 ? item.category : '衣服';
            var pid = 'prod_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);
            newProductIds.push(pid);
            store.shopProducts.push({
                id:pid,
                name:item.name||'商品', price:Number(item.price)||9.9, desc:item.desc||'',
                category:cat, images:[window._shopGetImg(cat)],
                seller:'YAN商城', sellerAvatar:'', fav:false, createdAt:Date.now(),
                searchTag:query.toLowerCase()
            });
        });
        save();
        // 直接渲染新生成的商品（不依赖关键词匹配）
        window._shopSearchNewIds = newProductIds;
        window._shopSearchQuery = query;
        window.shopRenderSearchResults(query);
        toast('找到 '+items.length+' 个相关商品');
    }catch(e){
        console.error('Shop search error:',e);
        toast('搜索失败: '+(e.message||'请重试'));
        window.shopRenderSearchResults(query);
    }
};

// ===== 3. Fix shopRenderSearchResults - horizontal rectangular cards =====
window.shopRenderSearchResults = function(query){
    var container = document.getElementById('shop-search-results');
    if(!container) return;
    var products = (store.shopProducts || []).slice();
    if(query){
        var q = query.toLowerCase();
        // 同时匹配关键词和searchTag标记（API搜索生成的商品带有searchTag）
        var newIds = window._shopSearchNewIds || [];
        products = products.filter(function(p){
            // 如果是刚刚API搜索生成的商品，直接显示
            if(newIds.length > 0 && newIds.indexOf(p.id) !== -1) return true;
            // 常规关键词匹配
            return (p.name||'').toLowerCase().indexOf(q)!==-1 || (p.desc||'').toLowerCase().indexOf(q)!==-1 || (p.category||'').toLowerCase().indexOf(q)!==-1 || (p.searchTag||'') === q;
        });
    }
    // 清除临时搜索ID标记
    window._shopSearchNewIds = [];
    if(products.length === 0){
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-search" style="font-size:36px;color:#ddd;margin-bottom:12px;display:block;"></i><p>'+(query?'没有找到相关商品':'输入关键词搜索')+'</p></div>';
        return;
    }
    container.innerHTML = products.map(function(p){
        var img = (p.images && p.images[0]) || '';
        return '<div class="shop-search-card" onclick="openShopDetail(\''+p.id+'\')">' +
            '<div class="shop-search-card-img">'+(img?'<img src="'+img+'">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;"><i class="fas fa-image" style="font-size:24px;color:#ddd;"></i></div>')+'</div>' +
            '<div class="shop-search-card-info">' +
                '<div class="shop-search-card-name">'+escapeHtml(p.name||'')+'</div>' +
                '<div class="shop-search-card-meta">'+escapeHtml(p.desc||'')+'</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">' +
                    '<div class="shop-search-card-price">¥'+Number(p.price||0).toFixed(2)+'</div>' +
                    '<div style="display:flex;gap:6px;">' +
                        '<button onclick="event.stopPropagation();shopShowPurchaseOptions(\''+p.id+'\')" class="shop-search-btn shop-gift-action-btn" style="font-size:12px;padding:4px 10px;border-radius:12px;"><i class="fas fa-gift"></i></button>' +
                        '<button onclick="event.stopPropagation();addToCart(\''+p.id+'\')" class="shop-search-btn" style="font-size:12px;padding:4px 10px;border-radius:12px;"><i class="fas fa-cart-plus"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
};

// ===== 4. Override renderShopProducts - text descriptions instead of images (Fix #1) =====
var _origRenderShopProducts = window.renderShopProducts;
window.renderShopProducts = function(){
    var grid = document.getElementById('shop-product-grid');
    var empty = document.getElementById('shop-empty');
    var products = (store.shopProducts || []).slice();
    if(window.shopActiveCate && window.shopActiveCate !== '推荐'){
        products = products.filter(function(p){ return p.category === window.shopActiveCate; });
    }
    products.sort(function(a,b){ return (b.createdAt||0)-(a.createdAt||0); });
    if(products.length === 0){ grid.innerHTML=''; empty.style.display=''; return; }
    empty.style.display='none';
    grid.innerHTML = products.map(function(p){
        var isFav = (store.shopFavorites||[]).indexOf(p.id) !== -1;
        var descText = p.aiDesc || p.desc || '暂无描述';
        var catColors = {'衣服':'#667eea','美妆':'#f093fb','食品':'#4facfe','鞋包':'#43e97b'};
        var bgColor = catColors[p.category] || '#667eea';
        return '<div class="shop-card" onclick="openShopDetail(\''+p.id+'\')">' +
            '<div class="shop-card-img-wrap" style="position:relative;">' +
                '<div class="shop-card-text-desc" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;background:linear-gradient(135deg,'+bgColor+'22,'+bgColor+'11);text-align:center;">' +
                    '<div style="font-size:28px;margin-bottom:6px;">'+(p.category==='衣服'?'👗':p.category==='美妆'?'💄':p.category==='食品'?'🍰':p.category==='鞋包'?'👜':'🛍️')+'</div>' +
                    '<div style="font-size:11px;color:#555;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">'+escapeHtml(descText)+'</div>' +
                '</div>' +
                '<div class="shop-card-fav" onclick="event.stopPropagation();shopToggleFav(\''+p.id+'\')"><i class="'+(isFav?'fas':'far')+' fa-heart" style="color:'+(isFav?'#ff4d4f':'rgba(0,0,0,0.3)')+'"></i></div>' +
            '</div>' +
            '<div class="shop-card-info">' +
                '<div class="shop-card-name">'+escapeHtml(p.name||'')+'</div>' +
                '<div class="shop-card-desc">'+escapeHtml(p.desc||'')+'</div>' +
                '<div class="shop-card-bottom">' +
                    '<div class="shop-card-price">¥'+Number(p.price||0).toFixed(2)+'</div>' +
                    '<div style="display:flex;gap:4px;">' +
                        '<button class="shop-card-gift-btn" onclick="event.stopPropagation();shopShowPurchaseOptions(\''+p.id+'\')"><i class="fas fa-gift"></i></button>' +
                        '<button class="shop-card-cart-btn" onclick="event.stopPropagation();addToCart(\''+p.id+'\')"><i class="fas fa-plus"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
};

// ===== 5. Purchase Options (Gift / Co-pay / Wallet) =====
window.shopShowPurchaseOptions = function(productId){
    var p = (store.shopProducts||[]).find(function(x){return x.id===productId;});
    if(!p) return;
    // Build modal
    var modal = document.getElementById('modal-shop-purchase-options');
    if(!modal){
        modal = document.createElement('div');
        modal.id = 'modal-shop-purchase-options';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-overlay" onclick="this.parentElement.style.display=\'none\'"></div><div class="modal-box" style="max-width:340px;border-radius:16px;"><div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0;"><span style="font-size:16px;font-weight:600;">购买方式</span><span class="modal-close" onclick="document.getElementById(\'modal-shop-purchase-options\').style.display=\'none\'" style="font-size:22px;color:#999;cursor:pointer;padding:0 4px;line-height:1;">×</span></div><div class="modal-body" id="shop-purchase-options-body"></div></div>';
        document.body.appendChild(modal);
    }
    var body = document.getElementById('shop-purchase-options-body');
    body.innerHTML = '<div style="text-align:center;margin-bottom:16px;"><div style="font-size:15px;font-weight:600;color:#333;">'+escapeHtml(p.name)+'</div><div style="font-size:20px;color:#fa5151;font-weight:700;margin-top:6px;">¥'+Number(p.price||0).toFixed(2)+'</div></div>' +
        '<div class="shop-purchase-option" onclick="shopGiftToContact(\''+productId+'\')"><div class="shop-purchase-option-icon" style="background:#ff6b81;"><i class="fas fa-gift"></i></div><div class="shop-purchase-option-info"><div class="shop-purchase-option-title">送给好友</div><div class="shop-purchase-option-desc">选择联系人，作为礼物送出</div></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div>' +
        '<div class="shop-purchase-option" onclick="shopCopayFromPurchase(\''+productId+'\')"><div class="shop-purchase-option-icon" style="background:#576b95;"><i class="fas fa-user-friends"></i></div><div class="shop-purchase-option-info"><div class="shop-purchase-option-title">好友代付</div><div class="shop-purchase-option-desc">选择联系人帮你付款</div></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div>' +
        '<div class="shop-purchase-option" onclick="shopWalletPay(\''+productId+'\')"><div class="shop-purchase-option-icon" style="background:#07c160;"><i class="fas fa-wallet"></i></div><div class="shop-purchase-option-info"><div class="shop-purchase-option-title">钱包支付</div><div class="shop-purchase-option-desc">使用微信钱包余额支付</div></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div>';
    modal.style.display = 'flex';
};

// Gift to contact
window.shopGiftToContact = function(productId){
    document.getElementById('modal-shop-purchase-options').style.display = 'none';
    var p = (store.shopProducts||[]).find(function(x){return x.id===productId;});
    if(!p) return;
    var contacts = (store.contacts||[]).filter(function(c){return c && c.id && c.name && !c.isGroup;});
    // Reuse copay modal for contact selection
    var modal = document.getElementById('modal-shop-copay');
    if(!modal) return;
    var list = document.getElementById('shop-copay-content');
    if(!list) list = modal.querySelector('.modal-body') || modal.querySelector('.modal-content');
    if(!list) return;
    var html = '<div style="padding:16px;"><div style="text-align:center;margin-bottom:16px;"><div style="font-size:14px;color:#666;">🎁 送礼物给好友</div><div style="font-size:18px;color:#fa5151;font-weight:700;margin-top:4px;">'+escapeHtml(p.name)+' ¥'+Number(p.price||0).toFixed(2)+'</div></div>';
    if(contacts.length===0){ html+='<div style="text-align:center;padding:30px;color:#999;">暂无联系人</div>'; }
    else{
        contacts.forEach(function(c){
            html += '<div onclick="shopSendGiftDirect(\''+c.id+'\',\''+productId+'\')" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:12px;margin-bottom:8px;cursor:pointer;"><img src="'+(c.avatar||_ph(40))+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:12px;"><span style="font-size:15px;flex:1;">'+escapeHtml(c.name)+'</span><i class="fas fa-gift" style="color:#ff6b81;"></i></div>';
        });
    }
    html += '</div>';
    list.innerHTML = html;
    modal.style.display = 'flex';
};

// [FIX-v2] 重命名为 shopSendGiftDirect 避免与 app-part3.js 的 shopSendGift(contactId, items, total) 冲突
window.shopSendGiftDirect = function(contactId, productId){
    document.getElementById('modal-shop-copay').style.display = 'none';
    var p = (store.shopProducts||[]).find(function(x){return x.id===productId;});
    var contact = (store.contacts||[]).find(function(c){return c.id===contactId;});
    if(!p || !contact) return;

    // Create order
    if(!store.shopOrders) store.shopOrders = [];
    var order = {
        id:'order_'+Date.now(), items:[{productId:productId,qty:1,price:p.price,name:p.name,image:(p.images&&p.images[0])||''}],
        total:p.price, status:'paid', payMethod:'gift', giftContactId:contactId, giftContactName:contact.name,
        address:null, time:Date.now(), logistics:null
    };
    store.shopOrders.unshift(order);

    // Send gift message to chat
    if(!store.chats[contactId]) store.chats[contactId] = [];
    store.chats[contactId].push({
        sender:'me', type:'shop_gift',
        content:JSON.stringify({orderId:order.id, productName:p.name, price:p.price, image:(p.images&&p.images[0])||''}),
        time:Date.now()
    });
    save();
    toast('🎁 礼物已送给 '+contact.name);
    // Re-render shop so products don't disappear
    if(typeof window.renderShopProducts === 'function') window.renderShopProducts();
};

// Co-pay from purchase options
window.shopCopayFromPurchase = function(productId){
    document.getElementById('modal-shop-purchase-options').style.display = 'none';
    var p = (store.shopProducts||[]).find(function(x){return x.id===productId;});
    if(!p) return;
    window.shopCopay([{productId:productId,qty:1,price:p.price,name:p.name,image:(p.images&&p.images[0])||''}]);
};

// Wallet pay
window.shopWalletPay = function(productId){
    document.getElementById('modal-shop-purchase-options').style.display = 'none';
    var p = (store.shopProducts||[]).find(function(x){return x.id===productId;});
    if(!p) return;
    window.shopPayNow([{productId:productId,qty:1,price:p.price,name:p.name,image:(p.images&&p.images[0])||''}], p.price);
};

// ===== 6. Override renderShopOrders - text display + clear button + receipt popup =====
window.renderShopOrders = function(){
    var page = document.getElementById('shop-orders-page');
    if(!page) return;
    var orders = store.shopOrders || [];
    if(orders.length === 0){
        page.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;"><i class="fas fa-receipt" style="font-size:48px;color:#ddd;margin-bottom:16px;"></i><p style="font-size:15px;">暂无订单</p></div>';
        return;
    }
    var html = '';
    // Clear button
    html += '<div style="display:flex;justify-content:flex-end;padding:4px 0 8px;"><div onclick="shopClearOrders()" style="padding:6px 14px;background:#fa5151;color:#fff;border-radius:16px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(250,81,81,0.3);"><i class="fas fa-trash-alt"></i> 清空订单</div></div>';

    html += orders.map(function(o){
        var statusMap = {paid:'已支付',pending_copay:'待代付',shipped:'已发货',delivered:'已签收',cancelled:'已取消'};
        var statusColor = {paid:'#07c160',pending_copay:'#e67e22',shipped:'#4facfe',delivered:'#999',cancelled:'#ccc'};
        var firstItem = (o.items||[])[0] || {};
        var itemNames = (o.items||[]).map(function(i){return i.name||'';}).join('、');
        var d = new Date(o.time);
        var timeStr = (d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
        var payIcon = '';
        if(o.payMethod==='copay') payIcon = '<span style="font-size:11px;color:#576b95;"><i class="fas fa-user-friends"></i> '+escapeHtml(o.copayContactName||'好友')+'代付</span>';
        else if(o.payMethod==='gift') payIcon = '<span style="font-size:11px;color:#ff6b81;"><i class="fas fa-gift"></i> 送给'+escapeHtml(o.giftContactName||'好友')+'</span>';

        // Determine category from product
        var cat = '';
        var prod = (store.shopProducts||[]).find(function(x){return x.id===firstItem.productId;});
        if(prod) cat = prod.category || '';
        var catColors = {'衣服':'#667eea','美妆':'#f093fb','食品':'#4facfe','鞋包':'#43e97b'};
        var bgColor = catColors[cat] || '#667eea';
        var catEmoji = cat==='衣服'?'👗':cat==='美妆'?'💄':cat==='食品'?'🍰':cat==='鞋包'?'👜':'🛍️';

        return '<div onclick="shopShowReceipt(\''+o.id+'\')" style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:8px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);cursor:pointer;">' +
            '<div style="width:56px;height:56px;border-radius:8px;overflow:hidden;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,'+bgColor+'22,'+bgColor+'11);">' +
                '<div style="font-size:22px;">'+catEmoji+'</div>' +
                '<div style="font-size:9px;color:#888;margin-top:2px;">'+escapeHtml(cat||'商品')+'</div>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeHtml(itemNames)+'</div>' +
                '<div style="font-size:11px;color:#999;margin-top:3px;">'+timeStr+' '+payIcon+'</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">' +
                    '<div style="font-size:14px;color:#fa5151;font-weight:600;">¥'+Number(o.total||0).toFixed(2)+'</div>' +
                    '<div style="font-size:11px;padding:2px 8px;border-radius:8px;background:'+(statusColor[o.status]||'#999')+'22;color:'+(statusColor[o.status]||'#999')+';">'+(statusMap[o.status]||o.status)+'</div>' +
                '</div>' +
            '</div>' +
            '<div onclick="event.stopPropagation();shopDeleteOrder(\''+o.id+'\')" style="padding:6px;cursor:pointer;color:#ccc;flex-shrink:0;"><i class="fas fa-trash-alt" style="font-size:13px;"></i></div>' +
        '</div>';
    }).join('');
    page.innerHTML = html;
};

// Delete single order - no confirm, direct action
window.shopDeleteOrder = function(orderId){
    console.log('[shopDeleteOrder] called with', orderId);
    store.shopOrders = (store.shopOrders || []).filter(function(o){ return o.id !== orderId; });
    save();
    window.renderShopOrders();
    toast('订单已删除');
};

// Clear orders helper - no confirm, direct action
window.shopClearOrders = function(){
    console.log('[shopClearOrders] called');
    store.shopOrders = [];
    save();
    window.renderShopOrders();
    toast('订单已清空');
};

// ===== 7. Receipt Popup =====
window.shopShowReceipt = function(orderId){
    var o = (store.shopOrders||[]).find(function(x){return x.id===orderId;});
    if(!o) return;
    var modal = document.getElementById('modal-shop-receipt');
    if(!modal){
        modal = document.createElement('div');
        modal.id = 'modal-shop-receipt';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-overlay" onclick="this.parentElement.style.display=\'none\'"></div><div class="modal-box shop-receipt-box"><div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0;"><span style="font-size:16px;font-weight:600;">订单详情</span><span class="modal-close" onclick="document.getElementById(\'modal-shop-receipt\').style.display=\'none\'" style="font-size:22px;color:#999;cursor:pointer;padding:0 4px;line-height:1;">×</span></div><div id="shop-receipt-content"></div></div>';
        document.body.appendChild(modal);
    }
    var content = document.getElementById('shop-receipt-content');
    var statusMap = {paid:'已支付',pending_copay:'待代付',shipped:'已发货',delivered:'已签收',cancelled:'已取消'};
    var d = new Date(o.time);
    var orderTime = d.getFullYear()+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0')+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');
    var payTime = new Date(o.time + 2000);
    var payTimeStr = payTime.getFullYear()+'/'+String(payTime.getMonth()+1).padStart(2,'0')+'/'+String(payTime.getDate()).padStart(2,'0')+' '+payTime.getHours().toString().padStart(2,'0')+':'+payTime.getMinutes().toString().padStart(2,'0')+':'+payTime.getSeconds().toString().padStart(2,'0');

    var itemsHtml = (o.items||[]).map(function(i){
        return '<div class="receipt-item"><span class="receipt-item-name">'+escapeHtml(i.name||'')+'</span><span class="receipt-item-qty">x'+i.qty+'</span><span class="receipt-item-price">¥'+Number(i.price||0).toFixed(2)+'</span></div>';
    }).join('');

    var payMethodMap = {wallet:'钱包支付',copay:'好友代付',gift:'送礼',cart:'购物车结算'};
    var payMethodStr = payMethodMap[o.payMethod] || '在线支付';
    if(o.payMethod==='copay' && o.copayContactName) payMethodStr += ' ('+escapeHtml(o.copayContactName)+')';
    if(o.payMethod==='gift' && o.giftContactName) payMethodStr += ' → '+escapeHtml(o.giftContactName);

    content.innerHTML = '<div class="shop-receipt">' +
        '<div class="receipt-header"><div class="receipt-logo"><i class="fas fa-store"></i></div><div class="receipt-shop-name">YAN商城</div><div class="receipt-divider-dashed"></div></div>' +
        '<div class="receipt-section"><div class="receipt-row"><span class="receipt-label">订单编号</span><span class="receipt-value">'+o.id.replace('order_','')+'</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">下单时间</span><span class="receipt-value">'+orderTime+'</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">支付时间</span><span class="receipt-value">'+payTimeStr+'</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">支付方式</span><span class="receipt-value">'+payMethodStr+'</span></div>' +
        '<div class="receipt-row"><span class="receipt-label">订单状态</span><span class="receipt-value" style="color:#07c160;">'+(statusMap[o.status]||o.status)+'</span></div></div>' +
        '<div class="receipt-divider-dashed"></div>' +
        '<div class="receipt-section"><div class="receipt-section-title">商品明细</div>'+itemsHtml+'</div>' +
        '<div class="receipt-divider-dashed"></div>' +
        '<div class="receipt-total"><span>合计</span><span class="receipt-total-price">¥'+Number(o.total||0).toFixed(2)+'</span></div>' +
        '<div style="padding:12px 16px;">' +
        '<button onclick="shopShareReceiptToContact(\'' + o.id + '\')" style="width:100%;padding:10px;background:#07c160;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;"><i class="fas fa-share-alt" style="margin-right:6px;"></i>分享小票给好友</button>' +
        '</div>' +
        '<div class="receipt-footer"><div class="receipt-barcode">|||||| |||| ||||| |||| ||||||</div><div class="receipt-thanks">感谢您的购买 ❤️</div></div>' +
    '</div>';
    modal.style.display = 'flex';
};

// ===== 7.5 Share shop receipt to contact =====
window.shopShareReceiptToContact = function(orderId) {
    var o = (store.shopOrders||[]).find(function(x){return x.id===orderId;});
    if(!o) return toast('订单不存在');

    // 关闭小票弹窗
    var modal = document.getElementById('modal-shop-receipt');
    if(modal) modal.style.display = 'none';

    var contacts = (store.contacts||[]).filter(function(c){return !c.isGroup;});
    if(!contacts.length) return toast('暂无联系人');

    var h = '<div class="fd-pay-overlay" onclick="this.remove()">';
    h += '<div class="fd-pay-sheet" onclick="event.stopPropagation()">';
    h += '<div class="fd-pay-header"><h3>🧾 分享小票给谁？</h3>';
    h += '<div class="fd-pay-close" onclick="this.closest(\'.fd-pay-overlay\').remove()"><i class="fas fa-times"></i></div></div>';
    contacts.forEach(function(c) {
        h += '<div class="fd-gift-contact-item" onclick="shopDoShareReceipt(\'' + orderId + '\',\'' + c.id + '\')">';
        h += '<div class="fd-gift-contact-avatar">' + (c.avatar ? '<img src="' + c.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤') + '</div>';
        h += '<div class="fd-gift-contact-info"><div class="fd-gift-contact-name">' + c.name + '</div><div class="fd-gift-contact-desc">发送购物小票</div></div>';
        h += '</div>';
    });
    h += '</div></div>';
    document.body.insertAdjacentHTML('beforeend', h);
};

window.shopDoShareReceipt = function(orderId, contactId) {
    var o = (store.shopOrders||[]).find(function(x){return x.id===orderId;});
    if(!o) return toast('订单不存在');

    var c = (store.contacts||[]).find(function(x){return x.id===contactId;});
    if(!c) return toast('联系人不存在');

    var itemNames = (o.items||[]).map(function(i){return i.name||'';}).join('、');

    if(!store.chats) store.chats = {};
    if(!store.chats[contactId]) store.chats[contactId] = [];
    store.chats[contactId].push({
        sender: 'me',
        type: 'shop-receipt-share',
        content: JSON.stringify({orderId: o.id, itemNames: itemNames, total: o.total}),
        time: Date.now()
    });

    var ov = document.querySelector('.fd-pay-overlay');
    if(ov) ov.remove();

    save();
    toast('🧾 已分享小票给 ' + c.name);

    // 如果当前在聊天界面，刷新
    if(typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === contactId) {
        try { renderHistory(); } catch(e) {}
    }
};

// ===== 8. Override renderShopCart - text display + clear button (Fix #3) =====
window.renderShopCart = function(){
    var page = document.getElementById('shop-cart-page');
    if(!page) return;
    var cart = store.shopCart || [];
    if(cart.length === 0){
        page.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;">' +
            '<i class="fas fa-shopping-cart" style="font-size:48px;color:#ddd;margin-bottom:16px;"></i>' +
            '<p style="font-size:15px;">购物车是空的</p>' +
            '<p style="font-size:12px;color:#bbb;margin-top:6px;">去首页逛逛吧</p>' +
            '<button onclick="shopSwitchTab(\'home\')" style="margin-top:16px;padding:10px 24px;border:none;background:linear-gradient(135deg,#fa5151,#ff6b6b);color:#fff;border-radius:20px;font-size:14px;">去逛逛</button>' +
        '</div>';
        return;
    }

    var total = 0;
    var totalQty = 0;
    var html = '';

    // Clear button - not overlapping, as a standalone bar
    html += '<div style="display:flex;justify-content:flex-end;padding:4px 0 8px;"><div onclick="shopClearCart()" style="padding:6px 14px;background:#fa5151;color:#fff;border-radius:16px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(250,81,81,0.3);"><i class="fas fa-trash-alt"></i> 清空购物车</div></div>';

    cart.forEach(function(item){
        var p = (store.shopProducts || []).find(function(x){ return x.id === item.productId; });
        if(!p) return;
        var subtotal = (p.price || 0) * item.qty;
        total += subtotal;
        totalQty += item.qty;
        var catColors = {'衣服':'#667eea','美妆':'#f093fb','食品':'#4facfe','鞋包':'#43e97b'};
        var bgColor = catColors[p.category] || '#667eea';
        var catEmoji = p.category==='衣服'?'👗':p.category==='美妆'?'💄':p.category==='食品'?'🍰':p.category==='鞋包'?'👜':'🛍️';
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:8px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
            '<div style="width:56px;height:56px;border-radius:8px;overflow:hidden;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,'+bgColor+'22,'+bgColor+'11);">' +
                '<div style="font-size:22px;">'+catEmoji+'</div>' +
                '<div style="font-size:9px;color:#888;margin-top:2px;">'+escapeHtml(p.category||'')+'</div>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeHtml(p.name||'')+'</div>' +
                '<div style="font-size:14px;color:#fa5151;font-weight:600;margin-top:3px;">¥'+Number(p.price||0).toFixed(2)+'</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
                '<button onclick="updateCartQty(\''+item.productId+'\',-1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>' +
                '<span style="font-size:14px;min-width:20px;text-align:center;">'+item.qty+'</span>' +
                '<button onclick="updateCartQty(\''+item.productId+'\',1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>' +
            '</div>' +
            '<div onclick="removeFromCart(\''+item.productId+'\')" style="padding:6px;cursor:pointer;color:#ccc;"><i class="fas fa-trash-alt" style="font-size:13px;"></i></div>' +
        '</div>';
    });

    html += '<div class="shop-cart-footer">' +
        '<div class="shop-cart-total">合计: <span style="color:#fa5151;font-size:20px;font-weight:700;">¥'+total.toFixed(2)+'</span></div>' +
        '<button class="shop-cart-checkout-btn" onclick="checkoutCart()">结算 ('+totalQty+')</button>' +
    '</div>';
    page.innerHTML = html;
};

// ===== Override removeFromCart & updateCartQty to call window.renderShopCart (Fix: closure issue) =====
window.removeFromCart = function(id){
    if (!store.shopCart) return;
    store.shopCart = store.shopCart.filter(function(c){ return c.productId !== id; });
    save();
    if(typeof window.updateCartBadge === 'function') window.updateCartBadge();
    window.renderShopCart();
};

window.updateCartQty = function(id, delta){
    var item = (store.shopCart || []).find(function(c){ return c.productId === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        store.shopCart = (store.shopCart || []).filter(function(c){ return c.productId !== id; });
    }
    save();
    if(typeof window.updateCartBadge === 'function') window.updateCartBadge();
    window.renderShopCart();
};

// Clear cart helper - no confirm, direct action
window.shopClearCart = function(){
    console.log('[shopClearCart] called');
    store.shopCart = [];
    save();
    if(typeof window.updateCartBadge === 'function') window.updateCartBadge();
    window.renderShopCart();
    if(typeof window.renderShopProducts === 'function') window.renderShopProducts();
    toast('购物车已清空');
};

// ===== Fix shopSwitchTab to use window.renderShopCart/renderShopOrders overrides =====
window.shopSwitchTab = function(tab){
    window.shopActiveTab = tab;
    ['home','cart','orders','me'].forEach(function(t){
        var el = document.getElementById('shop-tab-' + t);
        if(el){ el.classList.remove('active'); el.style.display = 'none'; }
    });
    var searchPanel = document.getElementById('shop-search-panel');
    if(searchPanel) searchPanel.style.display = 'none';

    var activeEl = document.getElementById('shop-tab-' + tab);
    if(activeEl){ activeEl.classList.add('active'); activeEl.style.display = 'block'; }

    document.querySelectorAll('.shop-bottom-tab').forEach(function(el, i){
        var tabs = ['home','cart','orders','me'];
        el.classList.toggle('active', tabs[i] === tab);
    });

    var titles = {home:'购物', cart:'购物车', orders:'我的订单', me:'我的'};
    var titleEl = document.getElementById('shop-nav-title');
    if(titleEl) titleEl.textContent = titles[tab] || '购物';

    if(tab === 'cart') window.renderShopCart();
    if(tab === 'orders') window.renderShopOrders();
    if(tab === 'home'){ window.renderShopProducts(); if(typeof window.updateCartBadge === 'function') window.updateCartBadge(); }
    if(tab === 'me' && typeof window.renderShopMe === 'function') window.renderShopMe();
    if(typeof window.updateCartBadge === 'function') window.updateCartBadge();
};

// ===== 9. Click outside modal to close (Fix #4) =====
(function(){
    var shopModalIds = [
        'modal-shop-detail', 'modal-shop-checkout', 'modal-shop-order-detail',
        'modal-shop-logistics', 'modal-shop-copay', 'modal-shop-receipt',
        'modal-shop-purchase-options'
    ];
    function attachOverlayClose(){
        shopModalIds.forEach(function(id){
            var modal = document.getElementById(id);
            if(!modal) return;
            // Only attach once
            if(modal._overlayCloseAttached) return;
            modal._overlayCloseAttached = true;
            modal.addEventListener('click', function(e){
                // Close if clicking directly on the modal backdrop (not inner content)
                if(e.target === modal){
                    modal.style.display = 'none';
                }
                // Also close if clicking on .modal-overlay
                if(e.target.classList && e.target.classList.contains('modal-overlay')){
                    modal.style.display = 'none';
                }
            });
        });
    }
    // Attach on load and periodically (for dynamically created modals)
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', attachOverlayClose);
    } else {
        attachOverlayClose();
    }
    setTimeout(attachOverlayClose, 2000);
    setTimeout(attachOverlayClose, 5000);
})();

// ===== 10. Override shopPayNow - deduct from wallet balance (Fix #5b) =====
var _origShopPayNow = window.shopPayNow;
window.shopPayNow = function(items, total){
    // Check balance
    var balance = store.user.balance || 0;
    if(balance < total){
        toast('余额不足！当前余额 ¥' + balance.toFixed(2) + '，需要 ¥' + total.toFixed(2));
        return;
    }
    // Deduct balance
    store.user.balance = (store.user.balance || 0) - total;
    // Record bill
    if(!store.bills) store.bills = [];
    store.bills.push({
        type: 'out',
        amt: total,
        desc: '商城购物 - ' + (items.map(function(i){return i.name||'';}).join('、')).substring(0, 30),
        time: Date.now()
    });
    save();
    // Call original
    _origShopPayNow.call(this, items, total);
};

// ===== 11. Chat message bubble for shop_gift and copay_request =====
// Extend getMsgText to handle shop_gift, copay_request, fav_product
var _origGetMsgText = window.getMsgText;
if(typeof _origGetMsgText === 'function'){
    window.getMsgText = function(m){
        if(m.type === 'shop_gift'){
            try{ var d = JSON.parse(m.content); return '[礼物] '+d.productName; }catch(e){ return '[礼物]'; }
        }
        if(m.type === 'copay_request'){
            try{ var d2 = JSON.parse(m.content); return '[代付请求] ¥'+d2.total; }catch(e){ return '[代付请求]'; }
        }
        if(m.type === 'fav_product'){
            try{ var d3 = JSON.parse(m.content); return '[收藏] '+d3.productName; }catch(e){ return '[收藏]'; }
        }
        return _origGetMsgText.call(this, m);
    };
}

// ===== Patch renderHistory to support fav_product bubble =====
(function(){
    // We need to inject fav_product case into the bubble rendering.
    // Override the bubble creation by patching after DOM is ready.
    var _origCreateBubble = window._createMsgBubble;
    // Since renderHistory is a closure in app-part1.js, we patch via MutationObserver on chat-history
    // Instead, we hook into the DOM after render to upgrade fav_product bubbles
    function upgradeFavBubbles(){
        var history = document.getElementById('chat-history');
        if(!history) return;
        // Find any bubble that contains raw fav_product JSON and upgrade it
        var bubbles = history.querySelectorAll('.bubble');
        bubbles.forEach(function(b){
            var text = b.textContent || '';
            if(text.indexOf('"fav_product"') !== -1 && text.indexOf('productName') !== -1){
                try{
                    var d = JSON.parse(text);
                    if(d.type === 'fav_product'){
                        b.className = b.className.replace('bubble','') + ' bubble-fav-product';
                        b.innerHTML = '<div class="fav-bubble-top"><div class="fav-bubble-icon"><i class="fas fa-heart"></i></div><div class="fav-bubble-info"><div class="fav-bubble-title">收藏了一个商品</div><div class="fav-bubble-name">'+escapeHtml(d.productName||'商品')+'</div></div></div><div class="fav-bubble-bottom">¥'+Number(d.productPrice||0).toFixed(2)+'</div>';
                        b.style.cursor = 'pointer';
                        b.onclick = function(){ if(typeof openShopDetail === 'function') openShopDetail(d.productId); };
                    }
                }catch(e){}
            }
        });
    }
    // Hook into renderHistory by observing chat-history mutations
    var observer = new MutationObserver(function(){ upgradeFavBubbles(); });
    function startObserving(){
        var el = document.getElementById('chat-history');
        if(el) observer.observe(el, {childList:true, subtree:true});
        else setTimeout(startObserving, 1000);
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserving);
    else startObserving();
})();

// ===== 9. Patch image URLs on existing products =====
var _origShopRefresh = window.shopRefreshProducts;
if(typeof _origShopRefresh === 'function'){
    window.shopRefreshProducts = async function(){
        try {
            await _origShopRefresh.apply(this, arguments);
        } catch(e) {
            console.error('shopRefreshProducts original error:', e);
            toast('刷新失败: '+(e.message||'请重试'));
            // 确保刷新按钮动画停止
            var fab = document.querySelector('.shop-fab-refresh');
            if(fab) fab.classList.remove('spinning');
        }
        // Patch dicebear URLs to picsum
        (store.shopProducts || []).forEach(function(p){
            if(p.images && p.images.length > 0){
                p.images = p.images.map(function(url){
                    if(typeof url === 'string' && url.indexOf('dicebear.com/7.x/icons/svg') !== -1){
                        return window._shopGetImg(p.category || '衣服');
                    }
                    return url;
                });
            }
        });
        save();
        // Always re-render after refresh
        if(typeof window.renderShopProducts === 'function') window.renderShopProducts();
    };
}

})();
// === FANFIC MODULE PART 3: CP Manager, Relay, Setting Gen, Dashboard, Report, Activities ===
(function(){
'use strict';
var rc=window._ffRc,VA=window._ffVAuthors,ACT=window._ffActivities,init=window._ffInit;

// === CP MANAGER ===
window.openFanficCPManager=function(){
    init();var m=document.getElementById('modal-fanfic-cp');
    if(!m){m=document.createElement('div');m.id='modal-fanfic-cp';m.className='modal-mask';document.body.appendChild(m);}
    var cps=store.fanfic.cps||[],cpH='';
    for(var i=0;i<cps.length;i++){var cp=cps[i];
        cpH+='<div class="ff-cp-card3"><div class="ff-cp-card3-top"><div class="ff-cp-char3"><div class="ff-cp-char3-avatar" style="background:'+(cp.char1.color||'#2BAE85')+'">'+escapeHtml(cp.char1.name.charAt(0))+'</div><div class="ff-cp-char3-name">'+escapeHtml(cp.char1.name)+'</div><div class="ff-cp-char3-pos">'+escapeHtml(cp.char1.position||'攻')+'</div></div><div class="ff-cp-heart3">💕</div><div class="ff-cp-char3"><div class="ff-cp-char3-avatar" style="background:'+(cp.char2.color||'#3498db')+'">'+escapeHtml(cp.char2.name.charAt(0))+'</div><div class="ff-cp-char3-name">'+escapeHtml(cp.char2.name)+'</div><div class="ff-cp-char3-pos">'+escapeHtml(cp.char2.position||'受')+'</div></div></div>';
        cpH+='<div class="ff-cp-card3-name">'+escapeHtml(cp.cpName||cp.char1.name+'×'+cp.char2.name)+'</div>';
        if(cp.char1.traits||cp.char2.traits)cpH+='<div class="ff-cp-card3-traits"><span>'+escapeHtml(cp.char1.traits||'')+'</span><span>'+escapeHtml(cp.char2.traits||'')+'</span></div>';
        cpH+='<div class="ff-cp-card3-actions"><button onclick="ffGenerateForCP(\''+cp.id+'\')"><i class="fas fa-magic"></i> 生成</button><button onclick="ffEditCP(\''+cp.id+'\')"><i class="fas fa-edit"></i></button><button onclick="ffDeleteCP(\''+cp.id+'\')"><i class="fas fa-trash-alt"></i></button></div></div>';
    }
    m.innerHTML='<div class="ff-modal-overlay" onclick="document.getElementById(\'modal-fanfic-cp\').style.display=\'none\'"></div><div class="modal-box ff-cp-modal"><div class="ff-modal-header"><span>💕 CP管理</span><span class="ff-modal-close" onclick="document.getElementById(\'modal-fanfic-cp\').style.display=\'none\'">×</span></div><div class="ff-modal-body"><div class="ff-cp-list3">'+cpH+'</div><div class="ff-cp-form3" id="ff-cp-form"><div class="ff-form-title">添加新CP</div><div class="ff-form-row"><div class="ff-form-col"><label>角色1名称</label><input type="text" id="ff-cp-c1name" placeholder="角色名"></div><div class="ff-form-col"><label>角色2名称</label><input type="text" id="ff-cp-c2name" placeholder="角色名"></div></div><div class="ff-form-row"><div class="ff-form-col"><label>角色1攻受</label><select id="ff-cp-c1pos"><option value="攻">攻</option><option value="受">受</option><option value="可逆">可逆</option></select></div><div class="ff-form-col"><label>角色2攻受</label><select id="ff-cp-c2pos"><option value="受">受</option><option value="攻">攻</option><option value="可逆">可逆</option></select></div></div><div class="ff-form-row"><div class="ff-form-col"><label>角色1性别</label><select id="ff-cp-c1gender"><option value="男">男</option><option value="女">女</option><option value="其他">其他</option></select></div><div class="ff-form-col"><label>角色2性别</label><select id="ff-cp-c2gender"><option value="男">男</option><option value="女">女</option><option value="其他">其他</option></select></div></div><div class="ff-form-row"><div class="ff-form-col"><label>角色1性格</label><input type="text" id="ff-cp-c1traits" placeholder="如：高冷、傲娇"></div><div class="ff-form-col"><label>角色2性格</label><input type="text" id="ff-cp-c2traits" placeholder="如：温柔、腹黑"></div></div><div class="ff-form-row"><div class="ff-form-col" style="flex:1"><label>CP名称(可选)</label><input type="text" id="ff-cp-cpname" placeholder="如：XX组"></div></div><div class="ff-form-row"><div class="ff-form-col" style="flex:1"><label>关联联系人(可选)</label><select id="ff-cp-contact1"><option value="">不关联</option></select><select id="ff-cp-contact2"><option value="">不关联</option></select></div></div><div class="ff-form-actions"><button class="ff-btn-cancel" onclick="document.getElementById(\'modal-fanfic-cp\').style.display=\'none\'">关闭</button><button class="ff-btn-primary2" onclick="addFanficCP()">添加CP</button></div></div></div></div>';
    m.style.display='flex';
    // [FIX-CP关联] populate联系人+用户人设组合选项
    var cs=store.contacts||[],s1=document.getElementById('ff-cp-contact1'),s2=document.getElementById('ff-cp-contact2');
    if(s1&&s2){
        for(var j=0;j<cs.length;j++){
            if(cs[j].isGroup)continue;
            var c=cs[j],upId=c.settings&&c.settings.userPersona,upObj=upId?(store.personas||[]).find(function(p){return p.id===upId;}):null;
            // 角色1下拉：联系人列表
            var o1=document.createElement('option');o1.value=c.id;o1.textContent=c.name;s1.appendChild(o1);
            // 角色2下拉：联系人+绑定的用户人设组合
            var o2=document.createElement('option');o2.value=c.id;
            o2.textContent=upObj?c.name+' 绑定的人设: '+upObj.name:c.name;
            o2.dataset.personaId=upId||'';o2.dataset.personaName=upObj?upObj.name:'';
            s2.appendChild(o2);
        }
        // 也为角色2添加所有用户人设（不通过联系人绑定的）
        var personas=store.personas||[];
        for(var pi=0;pi<personas.length;pi++){
            var p=personas[pi];
            var op=document.createElement('option');op.value='persona_'+p.id;op.textContent='👤 用户人设: '+p.name+(p.note?' ('+p.note+')':'');op.dataset.personaId=p.id;op.dataset.personaName=p.name;s2.appendChild(op);
        }
    }
};
// [FIX-CP关联] 联系人选择变化时自动填充角色信息
window._ffOnContactComboChange=function(){};
window.addFanficCP=function(){
    init();var n1=(document.getElementById('ff-cp-c1name').value||'').trim(),n2=(document.getElementById('ff-cp-c2name').value||'').trim();
    if(!n1||!n2)return toast('请输入两个角色名');
    // [FIX-CP关联] 解析角色1的联系人ID和角色2的联系人ID/人设ID
    var contact1Val=document.getElementById('ff-cp-contact1')?document.getElementById('ff-cp-contact1').value:'';
    var contact2Val=document.getElementById('ff-cp-contact2')?document.getElementById('ff-cp-contact2').value:'';
    var char1ContactId=contact1Val;
    var char2ContactId='',char2PersonaId='';
    if(contact2Val.indexOf('persona_')===0){
        // 选择的是用户人设
        char2PersonaId=contact2Val.replace('persona_','');
    }else{
        char2ContactId=contact2Val;
        // 如果选了联系人，也获取其绑定的人设ID
        if(char2ContactId){
            var selOpt=document.getElementById('ff-cp-contact2');
            if(selOpt&&selOpt.selectedOptions&&selOpt.selectedOptions[0]){
                char2PersonaId=selOpt.selectedOptions[0].dataset.personaId||'';
            }
        }
    }
    var cp={id:'cp_'+Date.now(),cpName:(document.getElementById('ff-cp-cpname').value||'').trim()||n1+'×'+n2,
        char1:{name:n1,position:document.getElementById('ff-cp-c1pos').value,gender:document.getElementById('ff-cp-c1gender').value,traits:(document.getElementById('ff-cp-c1traits').value||'').trim(),contactId:char1ContactId,color:window._ffCovers[Math.floor(Math.random()*window._ffCovers.length)]||'#2BAE85'},
        char2:{name:n2,position:document.getElementById('ff-cp-c2pos').value,gender:document.getElementById('ff-cp-c2gender').value,traits:(document.getElementById('ff-cp-c2traits').value||'').trim(),contactId:char2ContactId,personaId:char2PersonaId,color:window._ffCovers[Math.floor(Math.random()*window._ffCovers.length)]||'#3498db'}};
    store.fanfic.cps.push(cp);saveStore();toast('CP已添加！');openFanficCPManager();
};
window.ffDeleteCP=function(cid){if(!confirm('删除此CP？'))return;store.fanfic.cps=store.fanfic.cps.filter(function(c){return c.id!==cid;});saveStore();openFanficCPManager();toast('已删除');};

// === GENERATE FOR CP ===
window.ffGenerateForCP=async function(cid){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return toast('CP不存在');
    if(!store.system||!store.system.key)return toast('请先配置API Key');
    toast('正在为 '+cp.cpName+' 生成故事...');
    try{
        // Build rich context from linked contacts' persona, worldbook, and chat history
        var c1Extra='',c2Extra='';
        if(cp.char1.contactId){var c1=store.contacts.find(function(x){return x.id===cp.char1.contactId;});if(c1){if(c1.persona)c1Extra+='\n人设详情: '+c1.persona;if(c1.settings&&c1.settings.mountedWbIds&&Array.isArray(c1.settings.mountedWbIds)){var wbs1=(store.worldbooks||[]).filter(function(wb){return c1.settings.mountedWbIds.includes(wb.id);});if(wbs1.length>0)c1Extra+='\n世界观: '+wbs1.map(function(wb){return wb.content;}).join('\n');}var chats1=store.chats&&store.chats[c1.id];if(chats1&&chats1.length>0){var recent1=chats1.slice(-10).filter(function(m){return m.type==='text';});if(recent1.length>0)c1Extra+='\n近期聊天风格参考: '+recent1.map(function(m){return(m.sender==='me'?'用户':c1.name)+': '+m.content;}).join('\n');}var mems1=store.memorySummaries&&store.memorySummaries[c1.id];if(mems1&&mems1.length>0)c1Extra+='\n记忆: '+mems1.slice(-3).map(function(m){return m.content;}).join('；');}}
        if(cp.char2.contactId){var c2=store.contacts.find(function(x){return x.id===cp.char2.contactId;});if(c2){if(c2.persona)c2Extra+='\n人设详情: '+c2.persona;if(c2.settings&&c2.settings.mountedWbIds&&Array.isArray(c2.settings.mountedWbIds)){var wbs2=(store.worldbooks||[]).filter(function(wb){return c2.settings.mountedWbIds.includes(wb.id);});if(wbs2.length>0)c2Extra+='\n世界观: '+wbs2.map(function(wb){return wb.content;}).join('\n');}var chats2=store.chats&&store.chats[c2.id];if(chats2&&chats2.length>0){var recent2=chats2.slice(-10).filter(function(m){return m.type==='text';});if(recent2.length>0)c2Extra+='\n近期聊天风格参考: '+recent2.map(function(m){return(m.sender==='me'?'用户':c2.name)+': '+m.content;}).join('\n');}var mems2=store.memorySummaries&&store.memorySummaries[c2.id];if(mems2&&mems2.length>0)c2Extra+='\n记忆: '+mems2.slice(-3).map(function(m){return m.content;}).join('；');}}
        // [FIX-CP关联] 如果角色2没有通过联系人获取到人设，尝试通过personaId获取
        if(!c2Extra&&cp.char2.personaId){var p2=(store.personas||[]).find(function(x){return x.id===cp.char2.personaId;});if(p2&&p2.desc)c2Extra+='\n人设详情: '+p2.desc;}
        // [FIX-一次生成] 合并文章+标签+评论为一次API调用
        var prompt='你是同人文作者。请为以下CP写一篇800-1500字的短篇同人文，并同时生成标签和读者评论。\nCP: '+cp.cpName+'\n角色1: '+cp.char1.name+'('+cp.char1.position+', '+cp.char1.gender+', 性格:'+cp.char1.traits+')'+c1Extra+'\n角色2: '+cp.char2.name+'('+cp.char2.position+', '+cp.char2.gender+', 性格:'+cp.char2.traits+')'+c2Extra+'\n要求：严格符合角色性格和人设，有情节有对话，甜中带虐或纯甜均可。角色的说话方式必须符合其人设和聊天风格。\n\n【输出格式要求】请严格按以下格式输出：\n1. 第一行写标题（不要加"标题："前缀）\n2. 空一行后写完整正文（800-1500字）\n3. 正文写完后，最后另起一行输出：\n<!--META:{"tags":["标签1","标签2","标签3"],"comments":[{"user":"读者网名","text":"针对文章具体内容的评论"}]}-->\n标签3-5个，评论5-8条，评论必须针对文章具体情节';
        var d=await window._ffApiCall([{role:'user',content:prompt}],0.9);
        var text=(d.choices[0].message.content||'').trim();
        text=window._ffSanitizeContent?window._ffSanitizeContent(text):text;
        var storyTags=['甜宠'];var storyComments=[];
        var _metaM1=text.match(/<!--META:([\s\S]*?)-->/);
        if(!_metaM1)_metaM1=text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if(!_metaM1)_metaM1=text.match(/(\{"tags"[\s\S]*?"comments"[\s\S]*?\})\s*$/);
        if(_metaM1){
            try{var metaObj=JSON.parse(_metaM1[1]);
                if(metaObj.tags&&Array.isArray(metaObj.tags))storyTags=metaObj.tags;
                if(metaObj.comments&&Array.isArray(metaObj.comments)){var _VA=window._ffVAuthors||[];for(var mi=0;mi<metaObj.comments.length;mi++){storyComments.push({user:metaObj.comments[mi].user||(_VA.length>0?_VA[Math.floor(Math.random()*_VA.length)].name:'读者'),text:(metaObj.comments[mi].text||'好看！').substring(0,100),time:Date.now()-Math.floor(Math.random()*86400000*3)});}}
            }catch(me){console.warn('META JSON解析失败:',me);}
            text=text.replace(/<!--META:[\s\S]*?-->/,'').replace(/```json\s*\{[\s\S]*?\}\s*```\s*$/,'').replace(/\{"tags"[\s\S]*?"comments"[\s\S]*?\}\s*$/,'').trim();
        }
        if(storyComments.length===0){var eng=window._ffGenEng(storyTags,'现言');storyComments=eng.comments;}
        var _ext=window._ffExtractTitle(text,cp.cpName+'的故事'),title=_ext.title,content=_ext.content;
        var engLikes=window._ffGenEng(storyTags,'现言');
        store.fanfic.stories.push({id:'ff_'+Date.now(),title:title,summary:content.substring(0,60),content:content,genre:'现言',author:VA[Math.floor(Math.random()*VA.length)].name,coverColor:rc(),wordCount:content.length,time:Date.now(),likes:engLikes.likes,comments:storyComments,status:'published',cpName:cp.cpName,cpId:cid,tags:storyTags,isMe:false});
        saveStore();renderFanficHome();toast('生成完成！');
    }catch(e){toast('生成失败: '+e.message);}
};

// === AI GENERATE RECOMMENDED ===
window.ffGenerateRecommended=async function(){
    init();if(!store.system||!store.system.key)return toast('请先配置API Key');
    toast('AI正在创作...');
    try{
        var genres=window._ffGenres.filter(function(g){return g!=='全部';}),g=genres[Math.floor(Math.random()*genres.length)];
        var tags=window._ffTags,t1=tags[Math.floor(Math.random()*tags.length)],t2=tags[Math.floor(Math.random()*tags.length)];
        // [FIX-一次生成] 合并文章+标签+评论为一次API调用
        var prompt='你是同人文作者。请写一篇'+g+'类型的同人短文，标签：'+t1+'、'+t2+'。800-1200字。要有完整情节和对话。\n\n【输出格式要求】请严格按以下格式输出：\n1. 第一行写标题（不要加"标题："前缀）\n2. 空一行后写完整正文（800-1200字）\n3. 正文写完后，最后另起一行输出：\n<!--META:{"tags":["'+t1+'","'+t2+'","标签3"],"comments":[{"user":"读者网名","text":"针对文章具体内容的评论"}]}-->\n标签3-5个（包含'+t1+'和'+t2+'），评论5-8条，评论必须针对文章具体情节';
        var d=await window._ffApiCall([{role:'user',content:prompt}],0.95);
        var text=(d.choices[0].message.content||'').trim();
        text=window._ffSanitizeContent?window._ffSanitizeContent(text):text;
        var va=VA[Math.floor(Math.random()*VA.length)];
        var storyTags=[t1,t2];var storyComments=[];
        var _metaM2=text.match(/<!--META:([\s\S]*?)-->/);
        if(!_metaM2)_metaM2=text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if(!_metaM2)_metaM2=text.match(/(\{"tags"[\s\S]*?"comments"[\s\S]*?\})\s*$/);
        if(_metaM2){
            try{var metaObj=JSON.parse(_metaM2[1]);
                if(metaObj.tags&&Array.isArray(metaObj.tags))storyTags=metaObj.tags;
                if(metaObj.comments&&Array.isArray(metaObj.comments)){var _VA2=window._ffVAuthors||[];for(var mi=0;mi<metaObj.comments.length;mi++){storyComments.push({user:metaObj.comments[mi].user||(_VA2.length>0?_VA2[Math.floor(Math.random()*_VA2.length)].name:'读者'),text:(metaObj.comments[mi].text||'好看！').substring(0,100),time:Date.now()-Math.floor(Math.random()*86400000*3)});}}
            }catch(me){console.warn('META JSON解析失败:',me);}
            text=text.replace(/<!--META:[\s\S]*?-->/,'').replace(/```json\s*\{[\s\S]*?\}\s*```\s*$/,'').replace(/\{"tags"[\s\S]*?"comments"[\s\S]*?\}\s*$/,'').trim();
        }
        if(storyComments.length===0){var eng=window._ffGenEng(storyTags,g);storyComments=eng.comments;}
        var _ext=window._ffExtractTitle(text,'推荐作品'),title=_ext.title,content=_ext.content;
        var engLikes=window._ffGenEng(storyTags,g);
        store.fanfic.stories.push({id:'ff_'+Date.now(),title:title,summary:content.substring(0,60),content:content,genre:g,author:va.name,coverColor:rc(),wordCount:content.length,time:Date.now(),likes:engLikes.likes,comments:storyComments,status:'published',tags:storyTags,isMe:false});
        saveStore();renderFanficHome();toast('新作品已生成！');
    }catch(e){toast('生成失败: '+e.message);}
};

// === RELAY WRITING ===
window.ffStartRelay=function(){
    init();var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-relay-start';
    m.innerHTML='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>发起接龙</span></div><div class="ff-panel-body"><div class="ff-form-field"><label>接龙标题</label><input type="text" id="ff-relay-title" placeholder="给接龙起个名字"></div><div class="ff-form-field"><label>开头段落</label><textarea id="ff-relay-opening" rows="6" placeholder="写下故事的开头..."></textarea></div><div class="ff-form-field"><label>参与作者数</label><select id="ff-relay-authors"><option value="3">3位</option><option value="5">5位</option><option value="8">8位</option></select></div><button class="ff-btn-primary2 ff-btn-full" onclick="ffCreateRelay()"><i class="fas fa-link"></i> 开始接龙</button></div>';
    document.body.appendChild(m);
};
window.ffCreateRelay=async function(){
    init();var title=(document.getElementById('ff-relay-title').value||'').trim(),opening=(document.getElementById('ff-relay-opening').value||'').trim();
    if(!title)return toast('请输入标题');if(!opening||opening.length<10)return toast('开头至少10字');
    var num=parseInt(document.getElementById('ff-relay-authors').value)||3;
    var relay={id:'relay_'+Date.now(),title:title,parts:[{author:'我',content:opening,time:Date.now()}],authorCount:num,status:'active',time:Date.now()};
    var el=document.getElementById('ff-relay-start');if(el)el.remove();
    toast('接龙已创建，AI作者接力中...');
    store.fanfic.relays.push(relay);saveStore();renderFanficHome();
    // AI authors take turns
    if(store.system&&store.system.key){
        var _shuffledVA=VA.slice();for(var _s=_shuffledVA.length-1;_s>0;_s--){var _j=Math.floor(Math.random()*(_s+1));var _tmp=_shuffledVA[_s];_shuffledVA[_s]=_shuffledVA[_j];_shuffledVA[_j]=_tmp;}
        for(var i=0;i<num;i++){
            var va=_shuffledVA[i%_shuffledVA.length];
            try{
                var ctx=relay.parts.map(function(p){return p.author+'：\n'+p.content;}).join('\n\n');
                var d=await API.chatCompletion([{role:'system',content:'你是同人文接龙作者"'+va.name+'"，风格：'+va.style+'。续写故事，200-400字，保持连贯。只输出续写内容。'},{role:'user',content:ctx+'\n\n请续写：'}],{temperature:0.9});
                var t=(d.choices[0].message.content||'').trim();
                relay.parts.push({author:va.name,content:t,time:Date.now(),avatar:va.avatar});
                saveStore();
            }catch(e){break;}
        }
        relay.status='completed';saveStore();renderFanficHome();toast('接龙完成！');
    }
};
window.ffOpenRelayDetail=function(rid){
    init();var r=store.fanfic.relays.find(function(x){return x.id===rid;});if(!r)return toast('接龙不存在');
    var ly=document.getElementById('layer-fanfic-read');ly.classList.add('show');
    var ph='';for(var i=0;i<r.parts.length;i++){var p=r.parts[i];ph+='<div class="ff-relay-part"><div class="ff-relay-part-header"><span class="ff-relay-part-avatar">'+(p.avatar||'✍️')+'</span><span class="ff-relay-part-author">'+escapeHtml(p.author)+'</span><span class="ff-relay-part-num">#'+(i+1)+'</span></div><div class="ff-relay-part-content">'+escapeHtml(p.content).replace(/\n/g,'<br>')+'</div></div>';}
    ly.innerHTML='<div class="ff-read-app"><div class="ff-read-header"><div class="ff-read-back" onclick="closeFanficRead()"><i class="fas fa-chevron-left"></i></div><div class="ff-read-title">'+escapeHtml(r.title)+'</div><div class="ff-read-actions"><span class="ff-relay-status-badge '+(r.status==='active'?'active':'')+'">'+( r.status==='active'?'进行中':'完结')+'</span></div></div><div class="ff-read-body"><div class="ff-relay-parts">'+ph+'</div>'+(r.status==='active'?'<button class="ff-btn-primary2 ff-btn-full" onclick="ffAddRelayPart(\''+rid+'\')"><i class="fas fa-pen"></i> 我也来写</button>':'')+'</div></div>';
};
window.ffAddRelayPart=function(rid){
    showPromptModal('写下你的接龙段落:','',{multiline:true}).then(function(t){if(!t||!t.trim())return;
    var r=store.fanfic.relays.find(function(x){return x.id===rid;});if(!r)return;
    r.parts.push({author:'我',content:t.trim(),time:Date.now()});saveStore();ffOpenRelayDetail(rid);toast('已添加');
    });
};

// === SETTING GENERATOR ===
window.ffOpenSettingGen=function(){
    init();var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-settinggen';
    m.innerHTML='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>🎨 设定生成器</span></div><div class="ff-panel-body"><div class="ff-form-field"><label>关键词</label><input type="text" id="ff-sg-keywords" placeholder="如：科幻、猫侦探、雨夜"></div><div class="ff-sg-quick"><span onclick="document.getElementById(\'ff-sg-keywords\').value=\'古风 江湖 宿命\'">古风江湖</span><span onclick="document.getElementById(\'ff-sg-keywords\').value=\'校园 暗恋 夏天\'">校园暗恋</span><span onclick="document.getElementById(\'ff-sg-keywords\').value=\'末世 求生 信任\'">末世求生</span><span onclick="document.getElementById(\'ff-sg-keywords\').value=\'娱乐圈 假戏真做 秘密\'">娱圈秘恋</span><span onclick="document.getElementById(\'ff-sg-keywords\').value=\'ABO 信息素 命运\'">ABO宿命</span></div><button class="ff-btn-primary2 ff-btn-full" onclick="ffDoSettingGen()"><i class="fas fa-magic"></i> 生成设定</button><div id="ff-sg-result" class="ff-sg-result"></div></div>';
    document.body.appendChild(m);
};
window.ffDoSettingGen=async function(){
    var kw=(document.getElementById('ff-sg-keywords').value||'').trim();if(!kw)return toast('请输入关键词');
    if(!store.system||!store.system.key)return toast('请先配置API Key');
    var res=document.getElementById('ff-sg-result');res.innerHTML='<div class="ff-loading"><i class="fas fa-spinner fa-spin"></i> 生成中...</div>';
    try{
        var d=await API.chatCompletion([{role:'user',content:'根据关键词"'+kw+'"，生成一个同人文设定，包括：\n1. 世界观背景(100字)\n2. 主角A设定(名字、性格、外貌、背景)\n3. 主角B设定(名字、性格、外貌、背景)\n4. 核心冲突\n5. 推荐情节走向\n请用清晰的格式输出。'}],{temperature:0.9});
        var text=(d.choices[0].message.content||'').trim();
        res.innerHTML='<div class="ff-sg-content">'+escapeHtml(text).replace(/\n/g,'<br>')+'</div><div class="ff-sg-actions"><button class="ff-btn-primary2" onclick="ffSaveSettingGen()"><i class="fas fa-bookmark"></i> 收藏</button><button class="ff-btn-secondary" onclick="ffUseSettingGen()"><i class="fas fa-pen"></i> 用此设定写作</button></div>';
        res.dataset.text=text;
    }catch(e){res.innerHTML='<div style="color:#e74c3c">生成失败: '+e.message+'</div>';}
};
window.ffSaveSettingGen=function(){
    init();var res=document.getElementById('ff-sg-result');if(!res||!res.dataset.text)return;
    store.fanfic.collections.push({id:'col_'+Date.now(),type:'setting',title:'设定: '+(document.getElementById('ff-sg-keywords').value||'').trim().substring(0,20),content:res.dataset.text,time:Date.now()});
    saveStore();toast('已收藏到书架');
};
window.ffUseSettingGen=function(){
    var res=document.getElementById('ff-sg-result');if(!res||!res.dataset.text)return;
    var el=document.getElementById('ff-settinggen');if(el)el.remove();
    openFanficWriteNew();
    setTimeout(function(){var ta=document.getElementById('ff-write-content');if(ta){ta.value='【设定参考】\n'+res.dataset.text+'\n\n---\n\n';document.getElementById('ff-write-wc').textContent=ta.value.length+'字';}},100);
};

// === ACTIVITIES ===
window.ffOpenActivities=function(){
    init();var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-activities';
    var h='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>🏆 主题活动</span></div><div class="ff-panel-body">';
    for(var i=0;i<ACT.length;i++){var a=ACT[i];
        h+='<div class="ff-act-detail-card" style="border-left:4px solid '+a.color+'"><div class="ff-act-detail-icon" style="background:'+a.color+'22">'+a.icon+'</div><div class="ff-act-detail-info"><div class="ff-act-detail-title">'+a.title+'</div><div class="ff-act-detail-desc">'+a.desc+'</div><div class="ff-act-detail-reward">🎁 '+a.reward+'</div></div><button class="ff-btn-primary2 ff-btn-sm" onclick="ffJoinActivity(\''+a.id+'\')">参加</button></div>';}
    h+='</div>';m.innerHTML=h;document.body.appendChild(m);
};
window.ffJoinActivity=function(aid){
    var a=ACT.find(function(x){return x.id===aid;});if(!a)return;
    var el=document.getElementById('ff-activities');if(el)el.remove();
    openFanficWriteNew();
    setTimeout(function(){var ti=document.getElementById('ff-write-title');if(ti){ti.value='【'+a.title+'】';ti.placeholder=a.desc;}},100);
    toast('已加入活动: '+a.title);
};

// === DASHBOARD ===
window.ffOpenDashboard=function(){
    init();var my=store.fanfic.stories.filter(function(s){return s.isMe&&s.status==='published';}),tl=0,tw=0,tc=(store.fanfic.bookshelf||[]).length,tv=0,tcc=0;
    for(var i=0;i<my.length;i++){tl+=(my[i].likes||[]).length;tw+=(my[i].wordCount||0);tv+=(my[i].views||0);tcc+=(my[i].comments||[]).length;}
    var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-dashboard';
    m.innerHTML='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>📊 创作数据</span></div><div class="ff-panel-body"><div class="ff-dash-grid"><div class="ff-dash-card" style="background:#2BAE85;color:#fff"><div class="ff-dash-num">'+my.length+'</div><div class="ff-dash-label">作品数</div></div><div class="ff-dash-card" style="background:#3498db;color:#fff"><div class="ff-dash-num">'+tw+'</div><div class="ff-dash-label">总字数</div></div><div class="ff-dash-card" style="background:#1abc9c;color:#fff"><div class="ff-dash-num">'+tl+'</div><div class="ff-dash-label">获赞数</div></div><div class="ff-dash-card" style="background:#e67e22;color:#fff"><div class="ff-dash-num">'+tc+'</div><div class="ff-dash-label">收藏数</div></div><div class="ff-dash-card" style="background:#8e44ad;color:#fff"><div class="ff-dash-num">'+tv+'</div><div class="ff-dash-label">总阅读</div></div><div class="ff-dash-card" style="background:#27ae60;color:#fff"><div class="ff-dash-num">'+tcc+'</div><div class="ff-dash-label">总评论</div></div></div><div class="ff-dash-detail"><div class="ff-dash-detail-title">📖 各作品数据</div><div id="ff-dash-detail-list"></div></div><div class="ff-dash-chart"><div class="ff-dash-chart-title">创作趋势</div><div class="ff-dash-bars" id="ff-dash-bars"></div></div></div>';
    document.body.appendChild(m);
    // per-story detail list
    var detailList=document.getElementById('ff-dash-detail-list');
    if(detailList&&my.length>0){var dlH='';for(var j=0;j<my.length;j++){var st=my[j];dlH+='<div class="ff-dash-story-row"><div class="ff-dash-story-title">'+escapeHtml(st.title||'无题')+'</div><div class="ff-dash-story-stats"><span><i class="far fa-eye"></i> '+(st.views||0)+'</span><span><i class="far fa-heart"></i> '+(st.likes||[]).length+'</span><span><i class="far fa-comment"></i> '+(st.comments||[]).length+'</span><span>'+(st.wordCount||0)+'字</span></div></div>';}detailList.innerHTML=dlH;}
    else if(detailList){detailList.innerHTML='<div style="text-align:center;padding:16px;color:#ccc">暂无作品数据</div>';}
    // simple bar chart
    var bars=document.getElementById('ff-dash-bars');if(!bars)return;
    var days=['周一','周二','周三','周四','周五','周六','周日'],bh='';
    for(var d=0;d<7;d++){var h=Math.floor(Math.random()*80)+10;bh+='<div class="ff-dash-bar-col"><div class="ff-dash-bar" style="height:'+h+'%"></div><div class="ff-dash-bar-label">'+days[d]+'</div></div>';}
    bars.innerHTML=bh;
};

// === REPORT ===
window.ffOpenReport=function(){
    init();var cps=store.fanfic.cps||[],my=store.fanfic.stories.filter(function(s){return s.isMe;}),fl=store.fanfic.follows||[];
    var topCP=cps.length>0?cps[0].cpName:'暂无';
    var genres={},words=[];
    for(var i=0;i<my.length;i++){var s=my[i];if(s.genre){genres[s.genre]=(genres[s.genre]||0)+1;}if(s.content){var w=s.content.match(/[\u4e00-\u9fa5]+/g);if(w)words=words.concat(w);}}
    var topGenre='暂无';var maxG=0;for(var g in genres)if(genres[g]>maxG){maxG=genres[g];topGenre=g;}
    // word frequency
    var freq={};for(var j=0;j<words.length;j++){var wd=words[j];if(wd.length>=2)freq[wd]=(freq[wd]||0)+1;}
    var topWords=Object.keys(freq).sort(function(a,b){return freq[b]-freq[a];}).slice(0,8);
    var wCloud='';for(var k=0;k<topWords.length;k++){var sz=20-k*1.5;wCloud+='<span class="ff-rpt-word" style="font-size:'+sz+'px;opacity:'+(1-k*0.08)+'">'+escapeHtml(topWords[k])+'</span> ';}
    if(!wCloud)wCloud='<span style="color:#ccc">暂无数据</span>';
    var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-report';
    m.innerHTML='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>📋 同人报告</span></div><div class="ff-panel-body">'+
    '<div class="ff-rpt-card"><div class="ff-rpt-card-title">🏷️ 最爱CP</div><div class="ff-rpt-card-value">'+escapeHtml(topCP)+'</div></div>'+
    '<div class="ff-rpt-card"><div class="ff-rpt-card-title">📚 最活跃圈子</div><div class="ff-rpt-card-value">'+escapeHtml(topGenre)+'</div></div>'+
    '<div class="ff-rpt-card"><div class="ff-rpt-card-title">✍️ 创作数</div><div class="ff-rpt-card-value">'+my.length+' 篇</div></div>'+
    '<div class="ff-rpt-card"><div class="ff-rpt-card-title">👥 关注作者</div><div class="ff-rpt-card-value">'+fl.length+' 位</div></div>'+
    '<div class="ff-rpt-cloud"><div class="ff-rpt-cloud-title">🔤 高频词云</div><div class="ff-rpt-cloud-words">'+wCloud+'</div></div>'+
    '<div class="ff-rpt-persona"><div class="ff-rpt-persona-title">🎭 你的同人人格</div><div class="ff-rpt-persona-text" id="ff-rpt-persona-text">点击生成</div><button class="ff-btn-primary2 ff-btn-full" onclick="ffGenPersona()"><i class="fas fa-magic"></i> 生成人格画像</button></div></div>';
    document.body.appendChild(m);
};
window.ffGenPersona=async function(){
    if(!store.system||!store.system.key)return toast('请先配置API Key');
    var el=document.getElementById('ff-rpt-persona-text');if(!el)return;
    el.innerHTML='<i class="fas fa-spinner fa-spin"></i> 分析中...';
    try{
        var cps=(store.fanfic.cps||[]).map(function(c){return c.cpName;}).join('、')||'暂无';
        var my=store.fanfic.stories.filter(function(s){return s.isMe;});
        var genres=my.map(function(s){return s.genre||'';}).filter(Boolean).join('、')||'暂无';
        var d=await API.chatCompletion([{role:'user',content:'根据以下信息生成一个有趣的"同人人格画像"(100字内)：\n喜欢的CP: '+cps+'\n创作类型: '+genres+'\n作品数: '+my.length+'\n请用可爱有趣的语气描述这个人的同人人格特征。'}],{temperature:0.9});
        el.textContent=(d.choices[0].message.content||'').trim();
    }catch(e){el.textContent='生成失败';}
};

// === FOLLOWS ===
window.ffToggleFollow=function(vaId){
    init();if(!store.fanfic.follows)store.fanfic.follows=[];
    var i=store.fanfic.follows.indexOf(vaId);
    if(i>-1){store.fanfic.follows.splice(i,1);toast('已取关');}
    else{store.fanfic.follows.push(vaId);toast('已关注');}
    saveStore();renderFanficHome();
};

// === BOOKSHELF / COLLECTIONS ===
window.ffToggleBookshelf=function(sid){
    init();if(!store.fanfic.bookshelf)store.fanfic.bookshelf=[];
    var i=store.fanfic.bookshelf.indexOf(sid);
    if(i>-1){store.fanfic.bookshelf.splice(i,1);toast('已取消收藏');}
    else{store.fanfic.bookshelf.push(sid);toast('已收藏');}
    saveStore();
};

// === SAVE HELPER (alias) ===
function saveStore(){if(typeof save==='function')save();else if(typeof saveStore2==='function')saveStore2();else try{localStorage.setItem('yan_store',JSON.stringify(store));}catch(e){}}

})();
// === FANFIC MODULE: Writing Styles, Plot Control, Longer Chapters ===
(function(){
'use strict';
var init=window._ffInit,rc=window._ffRc,VA=window._ffVAuthors;
function ensureStyles(){init();if(!store.fanfic.styles)store.fanfic.styles=[];}
function sv(){if(typeof save==='function')save();else try{localStorage.setItem('yan_store',JSON.stringify(store));}catch(e){}}
function mkModal(id){var m=document.getElementById(id);if(!m){m=document.createElement('div');m.id=id;m.className='modal-mask';document.body.appendChild(m);}return m;}
function closeM(id){document.getElementById(id).style.display='none';}

// ===== STYLE CRUD =====
window.ffOpenStyleManager=function(){
    ensureStyles();var st=store.fanfic.styles,h='';
    if(!st.length)h='<div style="text-align:center;padding:30px;color:#999;">还没有自定义文风</div>';
    else for(var i=0;i<st.length;i++){var s=st[i];
        h+='<div style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:#f9f9fb;border-radius:12px;margin-bottom:8px;">';
        h+='<div style="flex:1"><div style="font-weight:600;">'+escapeHtml(s.name)+'</div>';
        h+='<div style="font-size:12px;color:#888;margin-top:4px;">'+escapeHtml(s.description||'')+'</div></div>';
        h+='<button onclick="ffEditStyle(\''+s.id+'\')" style="border:none;background:#eef2ff;color:#667eea;width:30px;height:30px;border-radius:8px;cursor:pointer"><i class="fas fa-edit"></i></button>';
        h+='<button onclick="ffDeleteStyle(\''+s.id+'\')" style="border:none;background:#fff0f0;color:#e74c3c;width:30px;height:30px;border-radius:8px;cursor:pointer"><i class="fas fa-trash-alt"></i></button>';
        h+='</div>';}
    var m=mkModal('m-ff-styles');
    m.innerHTML='<div class="ff-modal-overlay" onclick="closeM(\'m-ff-styles\')"></div>'
        +'<div class="modal-box" style="max-width:400px;border-radius:16px;max-height:80vh;display:flex;flex-direction:column">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">'
        +'<span style="font-size:16px;font-weight:600">🖋️ 文风管理</span>'
        +'<span onclick="closeM(\'m-ff-styles\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="flex:1;overflow-y:auto;padding:16px">'+h+'</div>'
        +'<div style="padding:12px 16px;border-top:1px solid #f0f0f0">'
        +'<button onclick="ffAddStyleForm()" style="width:100%;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:12px;cursor:pointer"><i class="fas fa-plus"></i> 添加文风</button>'
        +'</div></div>';
    m.style.display='flex';
};
window.closeM=function(id){document.getElementById(id).style.display='none';};

window.ffAddStyleForm=function(eid){
    ensureStyles();var ex=null;
    if(eid)ex=store.fanfic.styles.find(function(s){return s.id===eid;});
    var m=mkModal('m-ff-se');
    m.innerHTML='<div class="ff-modal-overlay" onclick="closeM(\'m-ff-se\')"></div>'
        +'<div class="modal-box" style="max-width:380px;border-radius:16px">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">'
        +'<span style="font-size:16px;font-weight:600">'+(ex?'编辑文风':'添加文风')+'</span>'
        +'<span onclick="closeM(\'m-ff-se\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="padding:16px">'
        +'<label style="font-size:13px;font-weight:500;color:#555;display:block;margin-bottom:6px">文风名称</label>'
        +'<input type="text" id="ff-sn" value="'+escapeHtml(ex?ex.name:'')+'" placeholder="如：温柔细腻" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;font-weight:500;color:#555;display:block;margin-bottom:6px">文风描述</label>'
        +'<textarea id="ff-sd" rows="4" placeholder="描述文风特点..." style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;box-sizing:border-box;resize:vertical">'+escapeHtml(ex?ex.description:'')+'</textarea>'
        +'<div style="display:flex;gap:8px;margin-top:14px">'
        +'<button onclick="closeM(\'m-ff-se\')" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer">取消</button>'
        +'<button onclick="ffSaveStyle(\''+(eid||'')+'\')" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:10px;cursor:pointer">保存</button>'
        +'</div></div></div>';
    m.style.display='flex';
};
window.ffSaveStyle=function(eid){
    ensureStyles();var n=(document.getElementById('ff-sn').value||'').trim(),d=(document.getElementById('ff-sd').value||'').trim();
    if(!n)return toast('请输入文风名称');
    if(eid){var s=store.fanfic.styles.find(function(x){return x.id===eid;});if(s){s.name=n;s.description=d;}}
    else store.fanfic.styles.push({id:'sty_'+Date.now(),name:n,description:d});
    sv();closeM('m-ff-se');ffOpenStyleManager();toast(eid?'已更新':'已添加');
};
window.ffEditStyle=function(sid){ffAddStyleForm(sid);};
window.ffDeleteStyle=function(sid){if(!confirm('删除此文风？'))return;ensureStyles();store.fanfic.styles=store.fanfic.styles.filter(function(s){return s.id!==sid;});sv();ffOpenStyleManager();toast('已删除');};

// ===== STYLE PICKER =====
var BS=[
    {id:'_b1',name:'甜宠日常',desc:'语言轻松甜蜜，节奏明快，注重心动瞬间'},
    {id:'_b2',name:'虐心催泪',desc:'情感浓烈，善用对比反转，注重内心挣扎'},
    {id:'_b3',name:'古风典雅',desc:'用词古朴，善用诗词意象，注重意境渲染'},
    {id:'_b4',name:'轻松搞笑',desc:'语言幽默诙谐，善用吐槽反差萌'},
    {id:'_b5',name:'悬疑烧脑',desc:'叙述冷静克制，善用伏笔悬念'}
];
window._ffShowStylePicker=function(cb){
    ensureStyles();
    var all=BS.map(function(b){return{name:b.name,desc:b.desc,custom:false};}).concat(store.fanfic.styles.map(function(s){return{name:s.name,desc:s.description||'',custom:true};}));
    var h='<div class="ff-sp-item" onclick="window._spCb(null);closeM(\'m-ff-sp\')" style="display:flex;align-items:center;gap:10px;padding:12px;background:#f9f9fb;border-radius:12px;margin-bottom:8px;cursor:pointer"><div style="width:36px;height:36px;border-radius:10px;background:#eee;display:flex;align-items:center;justify-content:center">🔄</div><div><div style="font-weight:500">默认风格</div><div style="font-size:11px;color:#999">不指定文风</div></div></div>';
    for(var i=0;i<all.length;i++){var s=all[i];
        h+='<div onclick="window._spCb({name:\''+escapeHtml(s.name).replace(/'/g,"\\'")+'\',description:\''+escapeHtml(s.desc).replace(/'/g,"\\'").replace(/\n/g,' ')+'\'});closeM(\'m-ff-sp\')" style="display:flex;align-items:center;gap:10px;padding:12px;background:'+(s.custom?'#f0f0ff':'#f9f9fb')+';border-radius:12px;margin-bottom:8px;cursor:pointer">';
        h+='<div style="width:36px;height:36px;border-radius:10px;background:#f0f0f0;display:flex;align-items:center;justify-content:center">'+(s.custom?'✨':'📝')+'</div>';
        h+='<div style="flex:1;min-width:0"><div style="font-weight:500">'+escapeHtml(s.name)+(s.custom?' <span style="font-size:10px;color:#667eea;background:#eef2ff;padding:1px 6px;border-radius:4px">自定义</span>':'')+'</div>';
        h+='<div style="font-size:11px;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escapeHtml(s.desc)+'</div></div></div>';}
    var m=mkModal('m-ff-sp');
    // [FIX-选择文风返回键] 点×或遮罩层只关闭弹窗，不触发回调（不会跳到下一步）
    m.innerHTML='<div class="ff-modal-overlay" onclick="closeM(\'m-ff-sp\')"></div>'
        +'<div class="modal-box" style="max-width:400px;border-radius:16px;max-height:80vh;display:flex;flex-direction:column">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #f0f0f0">'
        +'<span onclick="closeM(\'m-ff-sp\')" style="font-size:14px;color:#667eea;cursor:pointer;display:flex;align-items:center;gap:4px"><i class="fas fa-chevron-left"></i> 返回</span>'
        +'<span style="font-size:16px;font-weight:600">🖋️ 选择文风</span>'
        +'<span onclick="closeM(\'m-ff-sp\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="flex:1;overflow-y:auto;padding:16px">'+h+'</div>'
        +'<div style="padding:8px 16px 12px;border-top:1px solid #f0f0f0;text-align:center">'
        +'<span onclick="closeM(\'m-ff-sp\');ffOpenStyleManager()" style="font-size:13px;color:#667eea;cursor:pointer"><i class="fas fa-cog"></i> 管理文风</span>'
        +'</div></div>';
    m.style.display='flex';window._spCb=cb;
};

// ===== PERSPECTIVE PICKER =====
window._ffShowPerspectivePicker=function(cb){
    var m=mkModal('m-ff-pov');
    m.innerHTML='<div class="ff-modal-overlay" onclick="ffPovSkip()"></div>'
        +'<div class="modal-box" style="max-width:400px;border-radius:16px;max-height:85vh;display:flex;flex-direction:column">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">'
        +'<span style="font-size:16px;font-weight:600">📐 视角 & 字数 & 要求</span>'
        +'<span onclick="ffPovSkip()" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="flex:1;overflow-y:auto;padding:16px">'
        +'<div style="font-size:13px;color:#666;margin-bottom:8px">叙事视角</div>'
        +'<div id="ff-pov-btns" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
        +'<span class="ff-pov-opt" data-v="" data-selected="true" onclick="ffSelectPov(this)" style="padding:8px 16px;background:#f0f0ff;color:#667eea;border-radius:10px;font-size:13px;cursor:pointer;border:2px solid #667eea">默认</span>'
        +'<span class="ff-pov-opt" data-v="第一人称" onclick="ffSelectPov(this)" style="padding:8px 16px;background:#f9f9fb;color:#555;border-radius:10px;font-size:13px;cursor:pointer;border:2px solid transparent">第一人称</span>'
        +'<span class="ff-pov-opt" data-v="第二人称" onclick="ffSelectPov(this)" style="padding:8px 16px;background:#f9f9fb;color:#555;border-radius:10px;font-size:13px;cursor:pointer;border:2px solid transparent">第二人称</span>'
        +'<span class="ff-pov-opt" data-v="第三人称" onclick="ffSelectPov(this)" style="padding:8px 16px;background:#f9f9fb;color:#555;border-radius:10px;font-size:13px;cursor:pointer;border:2px solid transparent">第三人称</span>'
        +'</div>'
        +'<div style="font-size:13px;color:#666;margin-bottom:8px">字数范围（可选）</div>'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">'
        +'<input type="number" id="ff-pov-wmin" placeholder="最少" value="800" style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;text-align:center">'
        +'<span style="color:#999">—</span>'
        +'<input type="number" id="ff-pov-wmax" placeholder="最多" value="1500" style="flex:1;padding:8px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;text-align:center">'
        +'<span style="color:#999;font-size:13px">字</span>'
        +'</div>'
        +'<div style="font-size:13px;color:#ff6b6b;font-weight:600;margin-bottom:8px">⭐ 创作要求（重要！将严格遵守）</div>'
        +(_ffGetPresetOptions().length>0?'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="font-size:12px;color:#666;flex-shrink:0;">预设：</span><select id="ff-pov-preset" onchange="ffApplyPreset()" style="flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:12px;background:#fff;"><option value="">自定义输入</option>'+_ffGetPresetOptions().join('')+'</select></div>':'')
        +'<textarea id="ff-pov-userreq" rows="4" placeholder="在这里填写你对故事的具体要求，例如：\n• 对方不知道我的真实身份\n• 角色A暗恋角色B但不敢表白\n• 两人是竞争对手关系\n• 故事发生在下雨天的咖啡厅\n\n这里的要求会被优先遵守！" style="width:100%;padding:10px;border:2px solid #ff6b6b;border-radius:10px;font-size:13px;box-sizing:border-box;resize:vertical;background:#fff5f5"></textarea>'
        +'<div style="display:flex;gap:8px;margin-top:14px">'
        +'<button onclick="ffPovSkip()" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer">跳过</button>'
        +'<button onclick="ffPovConfirm()" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:10px;cursor:pointer;font-weight:600">确定</button>'
        +'</div></div></div>';
    m.style.display='flex';window._povCb=cb;window._ffAutoFillDefaultPreset();
};
window.ffSelectPov=function(el){
    var btns=document.querySelectorAll('.ff-pov-opt');
    for(var i=0;i<btns.length;i++){btns[i].style.border='2px solid transparent';btns[i].style.background='#f9f9fb';btns[i].style.color='#555';delete btns[i].dataset.selected;}
    el.style.border='2px solid #667eea';el.style.background='#f0f0ff';el.style.color='#667eea';el.dataset.selected='true';
};
// 跳过按钮：仍然读取要求框内容（防止用户写了要求但点了跳过导致丢失）
window.ffPovSkip=function(){
    var ur=(document.getElementById('ff-pov-userreq').value||'').trim()||null;
    window._povCb({pov:null,wordMin:null,wordMax:null,userReq:ur});
    closeM('m-ff-pov');
};
// 确定按钮：读取所有字段
window.ffPovConfirm=function(){
    var sel=document.querySelector('.ff-pov-opt[data-selected=true]');
    if(!sel)sel=document.querySelector('.ff-pov-opt');
    var pv=(sel&&sel.dataset.v)||null;
    var wn=parseInt(document.getElementById('ff-pov-wmin').value)||null;
    var wx=parseInt(document.getElementById('ff-pov-wmax').value)||null;
    var ur=(document.getElementById('ff-pov-userreq').value||'').trim()||null;
    window._povCb({pov:pv||null,wordMin:wn,wordMax:wx,userReq:ur});
    closeM('m-ff-pov');
};

// === 预设提示词选择器辅助函数 ===
function _ffGetPresetOptions(){
    var prompts=(store.fanfic&&store.fanfic.customPrompts)||[];
    if(!prompts.length)return[];
    var opts=[];
    for(var i=0;i<prompts.length;i++){
        var p=prompts[i];
        opts.push('<option value="'+i+'"'+(p.isDefault?' selected':'')+'>'+escapeHtml(p.name)+(p.isDefault?' ⭐':'')+'</option>');
    }
    return opts;
}
window._ffGetPresetOptions=_ffGetPresetOptions;
window.ffApplyPreset=function(){
    var sel=document.getElementById('ff-pov-preset');
    var ta=document.getElementById('ff-pov-userreq');
    if(!sel||!ta)return;
    var idx=parseInt(sel.value);
    if(isNaN(idx)){ta.value='';ta.style.background='#fff5f5';return;}
    var prompts=(store.fanfic&&store.fanfic.customPrompts)||[];
    if(!prompts[idx])return;
    ta.value=prompts[idx].content||'';
    ta.style.background='#f0faf5';
};
// 自动填入默认预设（POV弹窗打开后延迟执行）
window._ffAutoFillDefaultPreset=function(){
    setTimeout(function(){
        var prompts=(store.fanfic&&store.fanfic.customPrompts)||[];
        var def=prompts.find(function(p){return p.isDefault;});
        if(def){
            var ta=document.getElementById('ff-pov-userreq');
            if(ta&&!ta.value.trim()){
                ta.value=def.content||'';
                ta.style.background='#f0faf5';
            }
        }
    },100);
};

// ===== PLOT DIRECTION =====
window._ffShowPlotPicker=function(cb){
    var tags=['重逢','误会','告白','争吵后和好','意外同居','身份暴露','生病照顾','吃醋','雨中邂逅','分离与等待'];
    var tH='';for(var i=0;i<tags.length;i++)tH+='<span onclick="document.getElementById(\'ff-pi\').value+=\''+tags[i]+'、\'" style="padding:4px 10px;background:#f0f0ff;color:#667eea;border-radius:8px;font-size:12px;cursor:pointer;display:inline-block;margin:2px">'+tags[i]+'</span>';
    var m=mkModal('m-ff-pl');
    m.innerHTML='<div class="ff-modal-overlay" onclick="window._plCb(null);closeM(\'m-ff-pl\')"></div>'
        +'<div class="modal-box" style="max-width:400px;border-radius:16px">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">'
        +'<span style="font-size:16px;font-weight:600">🎯 剧情走向</span>'
        +'<span onclick="window._plCb(null);closeM(\'m-ff-pl\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="padding:16px">'
        +'<div style="font-size:13px;color:#666;margin-bottom:10px">描述你希望的剧情走向（可选）</div>'
        +'<textarea id="ff-pi" rows="3" placeholder="如：两人在雨中重逢..." style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;box-sizing:border-box;resize:vertical"></textarea>'
        +'<div style="margin-top:8px">'+tH+'</div>'
        +'<div style="display:flex;gap:8px;margin-top:14px">'
        +'<button onclick="window._plCb(null);closeM(\'m-ff-pl\')" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer">跳过</button>'
        +'<button onclick="window._plCb((document.getElementById(\'ff-pi\').value||\'\').trim()||null);closeM(\'m-ff-pl\')" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:10px;cursor:pointer">确定</button>'
        +'</div></div></div>';
    m.style.display='flex';window._plCb=cb;
};

// ===== AI OVERRIDES =====
// [FIX] pickFlow增加cancelled标记：用户关闭选择器时不触发回调，避免意外发起API请求
function pickFlow(cb){
    var _cancelled=false;
    window._ffShowStylePicker(function(sty){
        if(_cancelled)return;
        window._ffShowPlotPicker(function(plot){
            if(_cancelled)return;
            window._ffShowPerspectivePicker(function(povData){
                if(_cancelled)return;
                cb(sty,plot,povData);
            });
        });
    });
}

// [FIX] AI续写防重复锁
// [FIX-续写死锁] 添加锁超时自动释放机制（180秒）
window._ffAssistLock=false;
window._ffAssistLockTimer=null;
function _ffSetAssistLock(val){
    window._ffAssistLock=val;
    // [MOD] 不做超时限制
}
window.ffAIAssist=function(){
    if(window._ffAssistLock)return toast('AI正在续写中，请稍候...');
    if(!store.system||!store.system.key)return toast('请先配置API Key');
    var co=document.getElementById('ff-write-content').value;
    if(!co||co.length<5)return toast('请先写一些内容');
    pickFlow(function(sty,plot,povData){
        // [FIX-续写反馈] 选择完成后立即显示loading弹窗
        _ffShowGenOverlay('AI续写中...','正在为你续写内容，请稍候');
        _doAssist(sty,plot,povData);
    });
};
async function _doAssist(sty,plot,povData){
    if(window._ffAssistLock){_ffHideGenOverlay();return;}
    _ffSetAssistLock(true);
    var co=document.getElementById('ff-write-content').value,ge=document.getElementById('ff-write-genre').value;
    try{
        var sp=sty?'文风：'+sty.name+'。'+sty.description+'。\n':'',pp=plot?'剧情走向：'+plot+'\n':'';
        var povP='';if(povData&&povData.pov)povP='叙事视角：'+povData.pov+'。\n';
        var wMin=(povData&&povData.wordMin)||600,wMax=(povData&&povData.wordMax)||1200;
        var userReqP='';if(povData&&povData.userReq)userReqP='【最重要！用户的创作要求，必须严格遵守，这是第一优先级】：'+povData.userReq+'\n\n';
        // [FIX-字数+乱码] 使用高max_tokens调用，强化字数要求
        // [FIX-上下文] 提取已写内容中的环境设定，传入更多前文（2500字）
        var envHint=window._ffExtractSettings(co);
        var envCtx=envHint?'\n【前文已确立的环境/场景设定（续写必须保持一致）】：\n'+envHint+'\n':'';
        var d=await window._ffApiCall([{role:'system',content:'你是写作助手。续写内容。\n'+userReqP+sp+pp+povP+envCtx+'要求：\n【字数硬性要求】续写必须达到'+wMin+'字以上，范围'+wMin+'-'+wMax+'字，严禁少于'+wMin+'字。\n必须从已写内容的结尾处自然衔接，不要跳过剧情。前文描写过的环境、场景设定必须保持一致。\n风格一致，有细节和对话。只输出续写。'+(userReqP?'\n\n再次强调，必须严格遵守用户的创作要求！':'')},{role:'user',content:'类型：'+ge+'\n已写：\n'+co.substring(Math.max(0,co.length-1500))+'\n\n请从上文结尾处自然续写（至少'+wMin+'字）：'}],0.85);
        var t=(d.choices[0].message.content||'').trim();
        // [FIX-乱码] 清洗续写内容
        t=window._ffSanitizeContent(t);
        document.getElementById('ff-write-content').value=co+'\n\n'+t;
        document.getElementById('ff-write-wc').textContent=(co+'\n\n'+t).length+'字';
        _ffHideGenOverlay();
        toast('续写完成 (+'+t.length+'字)');
    }catch(e){_ffHideGenOverlay();toast('续写失败: '+e.message,'error');}finally{_ffSetAssistLock(false);}
}

// [FIX] 续写防重复锁 + 完成后跳转到最新章节
window.ffContinueStory=function(sid){
    if(window._ffContinueLock){return toast('正在续写中，请稍候...');}
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return;
    if(!store.system||!store.system.key)return toast('请先配置API Key');
    pickFlow(function(sty,plot,povData){
        // [FIX-续写反馈] 选择完成后立即显示loading弹窗
        _ffShowGenOverlay('正在续写中...','AI正在为你创作新章节，请稍候');
        _doCont(sid,sty,plot,povData);
    });
};
async function _doCont(sid,sty,plot,povData){
    if(window._ffContinueLock){_ffHideGenOverlay();return;}
    _ffSetContinueLock(true);
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s){_ffSetContinueLock(false);_ffHideGenOverlay();return;}
    try{
        var sp=sty?'文风：'+sty.name+'。'+sty.description+'。\n':'',pp=plot?'剧情走向：'+plot+'\n':'';
        var povP='';if(povData&&povData.pov)povP='叙事视角：'+povData.pov+'。\n';
        var wMin=(povData&&povData.wordMin)||800,wMax=(povData&&povData.wordMax)||1500;
        var userReqP='';if(povData&&povData.userReq){userReqP='【最重要！用户的创作要求，必须严格遵守，这是第一优先级】：'+povData.userReq+'\n\n';s.userReq=povData.userReq;}
        var existingChs=window._ffParseChapters(s.content);
        // [FIX] 如果原文没有章节标记，给原文加上"第一章"标记
        var firstChHasMarker=/^(第[一二三四五六七八九十百千\d]+章|Chapter\s*\d+)/m.test(s.content);
        if(!firstChHasMarker&&s.content&&s.content.trim()){
            s.content='第一章 '+escapeHtml(s.title||'开篇')+'\n\n'+s.content;
            sv();
            existingChs=window._ffParseChapters(s.content);
        }
        var nextNum=existingChs.length+1;
        // [FIX] 每次续写都生成新章节标题，不再只在多章时才加
        var chapterPrompt='必须以"第'+window._numToChinese(nextNum)+'章 [你起的章节标题]"开头，章节标题要与本章内容相关。\n';
        // [FIX] 使用完整故事上下文，包含前文摘要、CP人设、用户要求等，避免断节
        var storyCtx=window._ffBuildStoryContext(s);
        // [FIX-字数+乱码] 使用高max_tokens调用，强化字数要求
        // [FIX-上下文] 续写prompt增加场景延续要求
        var d=await window._ffApiCall([{role:'system',content:'你是同人文作者。续写故事。\n'+userReqP+sp+pp+povP+chapterPrompt+'\n'+storyCtx+'\n要求：\n1. '+chapterPrompt+'2. 【字数硬性要求】续写必须达到'+wMin+'字以上，范围'+wMin+'-'+wMax+'字，严禁少于'+wMin+'字\n3. 【关键】必须从上一章结尾处自然衔接，不要跳过任何剧情节点。如果上一章结尾是在某个场景中，续写应从该场景继续\n4. 前文中描写过的环境、房间布置、物品摆设等设定必须保持一致，不要遗忘或改变\n5. 保持人物性格、关系和情节连贯\n6. 有心理描写和环境描写，有细节和对话\n7. 只输出新章节内容（包含章节标题行）'+(userReqP?'\n8. 必须严格遵守用户的创作要求！':'')},{role:'user',content:'请续写第'+window._numToChinese(nextNum)+'章（至少'+wMin+'字），从上一章结尾自然衔接：'}],0.85);
        var t=(d.choices[0].message.content||'').trim();
        // [FIX-乱码] 清洗续写内容
        t=window._ffSanitizeContent(t);
        // [FIX] 确保续写内容有章节标记，如果AI没加就补上
        if(!/^第[一二三四五六七八九十百千\d]+章/.test(t)){
            var _ext=window._ffExtractTitle(t,'第'+window._numToChinese(nextNum)+'章');
            t='第'+window._numToChinese(nextNum)+'章 '+_ext.title+'\n\n'+_ext.content;
        }
        s.content+='\n\n'+t;s.wordCount=s.content.length;sv();
        var newChs=window._ffParseChapters(s.content);
        openFanficRead(sid,newChs.length-1);
        _ffHideGenOverlay();
        toast('续写完成 (+'+t.length+'字)');
        setTimeout(function(){var rb=document.querySelector('.ff-read-body');if(rb)rb.scrollTop=rb.scrollHeight;},150);
    }catch(e){_ffHideGenOverlay();toast('续写失败: '+e.message,'error');}finally{_ffSetContinueLock(false);}
}

window.ffGenerateForCP=function(cid){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return toast('CP不存在');
    if(!store.system||!store.system.key)return toast('请先配置API Key');
    pickFlow(function(sty,plot,povData){_doGenCP(cid,sty,plot,povData);});
};
async function _doGenCP(cid,sty,plot,povData){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return;
    _ffShowGenOverlay('正在为 '+cp.cpName+' 生成...','AI正在创作同人文，请稍候');
    try{
        var c1E='',c2E='';
        if(cp.char1.contactId){var c1=(store.contacts||[]).find(function(x){return x.id===cp.char1.contactId;});if(c1&&c1.persona)c1E='\n人设:'+c1.persona;}
        // [FIX-CP关联] 支持通过personaId获取用户人设信息
        if(cp.char2.contactId){var c2=(store.contacts||[]).find(function(x){return x.id===cp.char2.contactId;});if(c2&&c2.persona)c2E='\n人设:'+c2.persona;}
        if(!c2E&&cp.char2.personaId){var p2=(store.personas||[]).find(function(x){return x.id===cp.char2.personaId;});if(p2&&p2.desc)c2E='\n人设:'+p2.desc;}
        var wv='';if(cp.worldviews&&cp.worldviews.length)wv='\n世界观:\n'+cp.worldviews.map(function(w){return w.name+':'+w.description;}).join('\n');
        var sp=sty?'\n文风：'+sty.name+'。'+sty.description:'',pp=plot?'\n剧情走向：'+plot:'';
        var povP='';if(povData&&povData.pov)povP='\n叙事视角：'+povData.pov;
        var wMin=(povData&&povData.wordMin)||2000,wMax=(povData&&povData.wordMax)||4000;
        var userReqP='';if(povData&&povData.userReq)userReqP='\n\n【最重要！用户的创作要求，必须严格遵守，这是第一优先级】：'+povData.userReq;
        // [FIX-一次生成] 合并文章+标签+评论为一次API调用，大幅提速且保证评论与文章匹配
        var pr='你是同人文作者。为CP写'+wMin+'-'+wMax+'字同人文，并同时生成标签和读者评论。'+userReqP+'\nCP:'+cp.cpName+'\n角色1:'+cp.char1.name+'('+cp.char1.position+','+cp.char1.gender+','+cp.char1.traits+')'+c1E+'\n角色2:'+cp.char2.name+'('+cp.char2.position+','+cp.char2.gender+','+cp.char2.traits+')'+c2E+wv+sp+pp+povP+'\n要求：符合性格，有情节对话，心理环境描写。\n【字数硬性要求】：正文必须达到'+wMin+'字以上，严禁少于'+wMin+'字。当前要求范围'+wMin+'-'+wMax+'字。请充分展开情节、对话和描写以达到字数要求。'+(userReqP?'\n\n再次强调，必须严格遵守用户的创作要求！':'')+'\n\n【输出格式要求】请严格按以下格式输出，先写完整正文，最后附上JSON元数据：\n1. 第一行写标题（不要加"标题："前缀）\n2. 空一行后写完整正文（'+wMin+'-'+wMax+'字）\n3. 正文写完后，最后另起一行输出一个JSON块，格式如下：\n<!--META:{"tags":["标签1","标签2","标签3"],"comments":[{"user":"读者网名","text":"针对文章具体内容的评论"},{"user":"读者网名","text":"评论"}]}-->\n标签要求：3-5个，如甜宠、HE、双向暗恋等\n评论要求：5-8条，必须针对文章的具体情节和角色，像真实读者，长短不一，可用颜文字emoji';
        var d=await window._ffApiCall([{role:'user',content:pr}],0.9);
        var tx=(d.choices[0].message.content||'').trim();
        tx=window._ffSanitizeContent(tx);
        // 解析META JSON块
        var _cpTags2=['甜宠'];var _cpComments2=[];
        var _metaMatch=tx.match(/<!--META:([\s\S]*?)-->/);
        if(!_metaMatch)_metaMatch=tx.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if(!_metaMatch)_metaMatch=tx.match(/(\{"tags"[\s\S]*?"comments"[\s\S]*?\})\s*$/);
        if(_metaMatch){
            try{var _mo2=JSON.parse(_metaMatch[1]);
                if(_mo2.tags&&Array.isArray(_mo2.tags))_cpTags2=_mo2.tags;
                if(_mo2.comments&&Array.isArray(_mo2.comments)){var _v2=window._ffVAuthors||[];for(var _i2=0;_i2<_mo2.comments.length;_i2++){_cpComments2.push({user:_mo2.comments[_i2].user||(_v2.length>0?_v2[Math.floor(Math.random()*_v2.length)].name:'读者'),text:(_mo2.comments[_i2].text||'好看').substring(0,100),time:Date.now()-Math.floor(Math.random()*86400000*3)});}}
            }catch(_e2){console.warn('META JSON解析失败:',_e2);}
            // 从正文中移除META块
            tx=tx.replace(/<!--META:[\s\S]*?-->/,'').replace(/```json\s*\{[\s\S]*?\}\s*```\s*$/,'').replace(/\{"tags"[\s\S]*?"comments"[\s\S]*?\}\s*$/,'').trim();
        }
        if(_cpComments2.length===0){var eng=window._ffGenEng(_cpTags2,'现言');_cpComments2=eng.comments;}
        var _ext=window._ffExtractTitle(tx,cp.cpName+'的故事'),ti=_ext.title,co=_ext.content;
        var _engL2=window._ffGenEng(_cpTags2,'现言');
        store.fanfic.stories.push({id:'ff_'+Date.now(),title:ti,summary:co.substring(0,60),content:co,genre:'现言',author:VA[Math.floor(Math.random()*VA.length)].name,coverColor:rc(),wordCount:co.length,time:Date.now(),likes:_engL2.likes,comments:_cpComments2,status:'published',cpName:cp.cpName,cpId:cid,tags:_cpTags2,isMe:false,userReq:(povData&&povData.userReq)||null});
        _ffHideGenOverlay();
        sv();renderFanficHome();toast('生成完成！('+co.length+'字)');
    }catch(e){_ffHideGenOverlay();toast('生成失败: '+e.message,'error');}
}

window.ffGenerateRecommended=async function(){
    init();if(!store.system||!store.system.key)return toast('请先配置API Key');
    _ffShowGenOverlay('AI创作中...','正在生成推荐作品，请稍候');
    try{
        var gs=window._ffGenres.filter(function(g){return g!=='全部';}),g=gs[Math.floor(Math.random()*gs.length)];
        var ts=window._ffTags,t1=ts[Math.floor(Math.random()*ts.length)],t2=ts[Math.floor(Math.random()*ts.length)];
        // [FIX-一次生成] 合并文章+标签+评论为一次API调用
        var d=await window._ffApiCall([{role:'user',content:'你是同人文作者。写一篇'+g+'类型同人短文，标签：'+t1+'、'+t2+'。\n【字数硬性要求】：正文必须达到2000字以上，严禁少于2000字。要求范围2000-4000字。请充分展开情节、对话和描写以达到字数要求。要有完整情节、丰富对话和细腻描写。\n\n【输出格式要求】请严格按以下格式输出，先写完整正文，最后附上JSON元数据：\n1. 第一行写标题（不要加"标题："前缀）\n2. 空一行后写完整正文（2000-4000字）\n3. 正文写完后，最后另起一行输出一个JSON块，格式如下：\n<!--META:{"tags":["'+t1+'","'+t2+'","标签3"],"comments":[{"user":"读者网名","text":"针对文章具体内容的评论"},{"user":"读者网名","text":"评论"}]}-->\n标签要求：3-5个，必须包含'+t1+'和'+t2+'\n评论要求：5-8条，必须针对文章的具体情节和角色，像真实读者，长短不一，可用颜文字emoji'}],0.95);
        var tx=(d.choices[0].message.content||'').trim();
        tx=window._ffSanitizeContent(tx);
        // 解析META JSON块
        var _rTags=[t1,t2];var _rComments=[];
        var _metaMatch3=tx.match(/<!--META:([\s\S]*?)-->/);
        if(!_metaMatch3)_metaMatch3=tx.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if(!_metaMatch3)_metaMatch3=tx.match(/(\{"tags"[\s\S]*?"comments"[\s\S]*?\})\s*$/);
        if(_metaMatch3){
            try{var _mo3=JSON.parse(_metaMatch3[1]);
                if(_mo3.tags&&Array.isArray(_mo3.tags))_rTags=_mo3.tags;
                if(_mo3.comments&&Array.isArray(_mo3.comments)){var _v3=window._ffVAuthors||[];for(var _i3=0;_i3<_mo3.comments.length;_i3++){_rComments.push({user:_mo3.comments[_i3].user||(_v3.length>0?_v3[Math.floor(Math.random()*_v3.length)].name:'读者'),text:(_mo3.comments[_i3].text||'好看').substring(0,100),time:Date.now()-Math.floor(Math.random()*86400000*3)});}}
            }catch(_e3){console.warn('META JSON解析失败:',_e3);}
            tx=tx.replace(/<!--META:[\s\S]*?-->/,'').replace(/```json\s*\{[\s\S]*?\}\s*```\s*$/,'').replace(/\{"tags"[\s\S]*?"comments"[\s\S]*?\}\s*$/,'').trim();
        }
        if(_rComments.length===0){var eng=window._ffGenEng(_rTags,g);_rComments=eng.comments;}
        var _ext=window._ffExtractTitle(tx,'推荐作品'),ti=_ext.title,co=_ext.content;
        var va=VA[Math.floor(Math.random()*VA.length)];
        var _engL3=window._ffGenEng(_rTags,g);
        store.fanfic.stories.push({id:'ff_'+Date.now(),title:ti,summary:co.substring(0,60),content:co,genre:g,author:va.name,coverColor:rc(),wordCount:co.length,time:Date.now(),likes:_engL3.likes,comments:_rComments,status:'published',tags:_rTags,isMe:false});
        _ffHideGenOverlay();
        sv();renderFanficHome();toast('新作品已生成！('+co.length+'字)');
    }catch(e){_ffHideGenOverlay();toast('生成失败: '+e.message,'error');}
};

// === 手动生成评论（AI智能版） ===
window.ffManualGenComments=async function(sid){
    var s=store.fanfic.stories.find(function(x){return x.id===sid;});if(!s)return toast('作品不存在');
    if(!s.comments)s.comments=[];
    // Also add some views and likes
    if(!s.views)s.views=0;
    s.views+=Math.floor(Math.random()*30)+10;
    if(!s.likes)s.likes=[];
    var newLikes=Math.floor(Math.random()*8)+2;
    for(var j=0;j<newLikes;j++){s.likes.push('u_gen_'+Date.now()+'_'+j);}

    // 如果有API Key，使用AI生成匹配文章内容的评论
    if(store.system&&store.system.key){
        if(typeof showPersistentLoading==='function')showPersistentLoading('正在生成评论...');
        try{
            var excerpt=(s.content||'').substring(0,600);
            var tagsInfo=(s.tags||[]).join('、')||'无';
            var genreInfo=s.genre||'未知';
            var titleInfo=s.title||'无题';
            var prompt='你是同人文读者。请根据以下同人文信息，生成5-8条读者评论。\n'+
                '标题：'+titleInfo+'\n'+
                '类型：'+genreInfo+'\n'+
                '标签：'+tagsInfo+'\n'+
                '内容节选：'+excerpt+'\n\n'+
                '要求：\n'+
                '1. 评论必须与文章的实际内容和风格匹配！如果是甜文就说甜，如果是虐文就说虐，如果是悬疑就说紧张\n'+
                '2. 部分评论要提到文中的具体情节或角色\n'+
                '3. 评论风格要像真实读者，有的长有的短，有的用颜文字\n'+
                '4. 用JSON数组格式输出：[{"text":"评论内容"},{"text":"评论内容"}]\n'+
                '5. 只输出JSON，不要其他内容';
            var d=await API.chatCompletion([{role:'user',content:prompt}],{temperature:0.9});
            var raw=(d.choices[0].message.content||'').trim();
            // 提取JSON
            var jsonMatch=raw.match(/\[[\s\S]*\]/);
            if(jsonMatch){
                var comments=JSON.parse(jsonMatch[0]);
                var VA=window._ffVAuthors||[];
                for(var i=0;i<comments.length;i++){
                    s.comments.push({
                        user:VA.length>0?VA[Math.floor(Math.random()*VA.length)].name:'读者'+Math.floor(Math.random()*100),
                        text:comments[i].text||comments[i].content||'好看！',
                        time:Date.now()-Math.floor(Math.random()*86400000*3)
                    });
                }
                if(typeof save==='function')save();
                openFanficRead(sid);
                if(typeof hidePersistentLoading==='function')hidePersistentLoading();
                toast('已生成 '+comments.length+' 条评论');
                return;
            }
        }catch(e){if(typeof hidePersistentLoading==='function')hidePersistentLoading();console.error('AI评论生成失败，回退到本地:',e);}
    }
    // 回退：没有API Key或AI失败时，用标签感知的本地评论
    var VA=window._ffVAuthors||[];
    var eng=window._ffGenEng(s.tags,s.genre);
    var fallbackComments=eng.comments;
    var newCount=Math.floor(Math.random()*5)+3;
    for(var i=0;i<newCount;i++){
        if(fallbackComments[i]){
            s.comments.push({user:fallbackComments[i].user,text:fallbackComments[i].text,time:Date.now()-Math.floor(Math.random()*86400000*3)});
        }else{
            s.comments.push({
                user:VA.length>0?VA[Math.floor(Math.random()*VA.length)].name:'读者'+Math.floor(Math.random()*100),
                text:'好看！',
                time:Date.now()-Math.floor(Math.random()*86400000*3)
            });
        }
    }
    if(typeof save==='function')save();
    openFanficRead(sid);
    if(typeof hidePersistentLoading==='function')hidePersistentLoading();
    toast('已生成 '+newCount+' 条新评论');
};

// === 为已有作品补充互动数据 ===
window.ffBoostAllStories=function(){
    var init=window._ffInit;init();
    var my=store.fanfic.stories.filter(function(s){return s.isMe&&s.status==='published';});
    if(!my.length)return toast('没有已发布的作品');
    var VA=window._ffVAuthors||[];
    for(var i=0;i<my.length;i++){
        var s=my[i];
        if(!s.views)s.views=Math.floor(Math.random()*300)+50;
        else s.views+=Math.floor(Math.random()*50)+10;
        if(!s.likes||s.likes.length===0){var eng=window._ffGenEng(s.tags,s.genre);s.likes=eng.likes;}
        else{var nl=Math.floor(Math.random()*10)+3;for(var j=0;j<nl;j++)s.likes.push('u_boost_'+Date.now()+'_'+j);}
        if(!s.comments||s.comments.length===0){
            // 使用标签/类型感知的评论生成
            var engC=window._ffGenEng(s.tags,s.genre);
            s.comments=engC.comments;
        }
    }
    if(typeof save==='function')save();
    if(typeof renderFanficHome==='function')renderFanficHome();
    toast('已为 '+my.length+' 篇作品生成互动数据 ✨');
};

})();
// === FANFIC MODULE: CP Edit + Worldview Management ===
(function(){
'use strict';
var init=window._ffInit;
function sv(){if(typeof save==='function')save();else try{localStorage.setItem('yan_store',JSON.stringify(store));}catch(e){}}
function mkM(id){var m=document.getElementById(id);if(!m){m=document.createElement('div');m.id=id;m.className='modal-mask';document.body.appendChild(m);}return m;}

// ===== CP EDIT =====
window.ffEditCP=function(cid){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return toast('CP不存在');
    if(!cp.worldviews)cp.worldviews=[];
    var wvH=_renderWvList(cp);
    var m=mkM('m-ff-cpe');
    var h='<div class="ff-modal-overlay" onclick="closeM(\'m-ff-cpe\')"></div>';
    h+='<div class="modal-box" style="max-width:420px;border-radius:16px;max-height:85vh;display:flex;flex-direction:column">';
    h+='<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">';
    h+='<span style="font-size:16px;font-weight:600">✏️ 编辑CP</span>';
    h+='<span onclick="closeM(\'m-ff-cpe\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>';
    h+='<div style="flex:1;overflow-y:auto;padding:16px">';
    // Row: names
    h+='<div style="display:flex;gap:8px;margin-bottom:10px">';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">角色1</label>';
    h+='<input id="cpe-n1" value="'+escapeHtml(cp.char1.name)+'" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box"></div>';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">角色2</label>';
    h+='<input id="cpe-n2" value="'+escapeHtml(cp.char2.name)+'" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box"></div></div>';
    // Row: position
    h+='<div style="display:flex;gap:8px;margin-bottom:10px">';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">攻受</label>';
    h+='<select id="cpe-p1" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px">';
    h+='<option value="攻"'+(cp.char1.position==='攻'?' selected':'')+'>攻</option>';
    h+='<option value="受"'+(cp.char1.position==='受'?' selected':'')+'>受</option>';
    h+='<option value="可逆"'+(cp.char1.position==='可逆'?' selected':'')+'>可逆</option></select></div>';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">攻受</label>';
    h+='<select id="cpe-p2" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px">';
    h+='<option value="受"'+(cp.char2.position==='受'?' selected':'')+'>受</option>';
    h+='<option value="攻"'+(cp.char2.position==='攻'?' selected':'')+'>攻</option>';
    h+='<option value="可逆"'+(cp.char2.position==='可逆'?' selected':'')+'>可逆</option></select></div></div>';
    // Row: gender
    h+='<div style="display:flex;gap:8px;margin-bottom:10px">';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">性别</label>';
    h+='<select id="cpe-g1" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px">';
    h+='<option value="男"'+(cp.char1.gender==='男'?' selected':'')+'>男</option>';
    h+='<option value="女"'+(cp.char1.gender==='女'?' selected':'')+'>女</option>';
    h+='<option value="其他"'+(cp.char1.gender==='其他'?' selected':'')+'>其他</option></select></div>';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">性别</label>';
    h+='<select id="cpe-g2" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px">';
    h+='<option value="男"'+(cp.char2.gender==='男'?' selected':'')+'>男</option>';
    h+='<option value="女"'+(cp.char2.gender==='女'?' selected':'')+'>女</option>';
    h+='<option value="其他"'+(cp.char2.gender==='其他'?' selected':'')+'>其他</option></select></div></div>';
    // Row: traits
    h+='<div style="display:flex;gap:8px;margin-bottom:10px">';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">性格</label>';
    h+='<input id="cpe-t1" value="'+escapeHtml(cp.char1.traits||'')+'" placeholder="如：傲娇、温柔" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box"></div>';
    h+='<div style="flex:1"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">性格</label>';
    h+='<input id="cpe-t2" value="'+escapeHtml(cp.char2.traits||'')+'" placeholder="如：腹黑、天然呆" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box"></div></div>';
    // CP name
    h+='<div style="margin-bottom:12px"><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">CP名称</label>';
    h+='<input id="cpe-cn" value="'+escapeHtml(cp.cpName||'')+'" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box"></div>';
    // Worldviews section
    h+='<div style="border-top:1px solid #f0f0f0;padding-top:12px;margin-top:4px">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    h+='<span style="font-size:14px;font-weight:600">🌍 世界观</span>';
    h+='<button onclick="ffAddWvToCP(\''+cid+'\')" style="border:none;background:#eef2ff;color:#667eea;padding:4px 10px;border-radius:8px;font-size:12px;cursor:pointer"><i class="fas fa-plus"></i> 添加</button></div>';
    h+='<div id="cpe-wv-list">'+wvH+'</div></div>';
    h+='</div>'; // end scroll area
    // Footer
    h+='<div style="padding:12px 16px;border-top:1px solid #f0f0f0;display:flex;gap:8px">';
    h+='<button onclick="closeM(\'m-ff-cpe\')" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer">取消</button>';
    h+='<button onclick="ffSaveCP(\''+cid+'\')" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:10px;cursor:pointer">保存</button>';
    h+='</div></div>';
    m.innerHTML=h;m.style.display='flex';
};

function _renderWvList(cp){
    if(!cp.worldviews||!cp.worldviews.length)return '<div style="text-align:center;padding:16px;color:#ccc;font-size:13px">暂无世界观设定</div>';
    var h='';
    for(var i=0;i<cp.worldviews.length;i++){var w=cp.worldviews[i];
        h+='<div style="padding:10px;background:#f9f9fb;border-radius:10px;margin-bottom:6px">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center">';
        h+='<span style="font-weight:600;font-size:13px">'+escapeHtml(w.name)+'</span>';
        h+='<div style="display:flex;gap:4px">';
        h+='<button onclick="ffEditWv(\''+cp.id+'\','+i+')" style="border:none;background:#eef2ff;color:#667eea;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:11px"><i class="fas fa-edit"></i></button>';
        h+='<button onclick="ffDelWv(\''+cp.id+'\','+i+')" style="border:none;background:#fff0f0;color:#e74c3c;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:11px"><i class="fas fa-trash-alt"></i></button>';
        h+='</div></div>';
        h+='<div style="font-size:12px;color:#888;margin-top:4px;line-height:1.4">'+escapeHtml(w.description||'')+'</div></div>';}
    return h;
}

window.ffSaveCP=function(cid){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return;
    cp.char1.name=(document.getElementById('cpe-n1').value||'').trim()||cp.char1.name;
    cp.char2.name=(document.getElementById('cpe-n2').value||'').trim()||cp.char2.name;
    cp.char1.position=document.getElementById('cpe-p1').value;
    cp.char2.position=document.getElementById('cpe-p2').value;
    cp.char1.gender=document.getElementById('cpe-g1').value;
    cp.char2.gender=document.getElementById('cpe-g2').value;
    cp.char1.traits=(document.getElementById('cpe-t1').value||'').trim();
    cp.char2.traits=(document.getElementById('cpe-t2').value||'').trim();
    cp.cpName=(document.getElementById('cpe-cn').value||'').trim()||cp.cpName;
    sv();closeM('m-ff-cpe');toast('CP已更新');
    if(typeof openFanficCPDetail==='function')openFanficCPDetail(cid);
};

// ===== WORLDVIEW CRUD =====
window.ffAddWvToCP=function(cid){_openWvForm(cid,-1);};
window.ffEditWv=function(cid,idx){_openWvForm(cid,idx);};

function _openWvForm(cid,idx){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return;
    if(!cp.worldviews)cp.worldviews=[];
    var ex=idx>=0?cp.worldviews[idx]:null;
    var m=mkM('m-ff-wve');
    var h='<div class="ff-modal-overlay" onclick="closeM(\'m-ff-wve\')"></div>';
    h+='<div class="modal-box" style="max-width:380px;border-radius:16px">';
    h+='<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">';
    h+='<span style="font-size:16px;font-weight:600">'+(ex?'编辑世界观':'添加世界观')+'</span>';
    h+='<span onclick="closeM(\'m-ff-wve\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>';
    h+='<div style="padding:16px">';
    h+='<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">世界观名称</label>';
    h+='<input id="wve-name" value="'+escapeHtml(ex?ex.name:'')+'" placeholder="如：现代都市、仙侠世界" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;box-sizing:border-box;margin-bottom:12px">';
    h+='<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">世界观描述</label>';
    h+='<textarea id="wve-desc" rows="5" placeholder="描述世界观的背景设定、规则、特色等..." style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;box-sizing:border-box;resize:vertical">'+escapeHtml(ex?ex.description:'')+'</textarea>';
    h+='<div style="display:flex;gap:8px;margin-top:14px">';
    h+='<button onclick="closeM(\'m-ff-wve\')" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:10px;cursor:pointer">取消</button>';
    h+='<button onclick="ffSaveWv(\''+cid+'\','+idx+')" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:10px;cursor:pointer">保存</button>';
    h+='</div></div></div>';
    m.innerHTML=h;m.style.display='flex';
}

window.ffSaveWv=function(cid,idx){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return;
    if(!cp.worldviews)cp.worldviews=[];
    var n=(document.getElementById('wve-name').value||'').trim(),d=(document.getElementById('wve-desc').value||'').trim();
    if(!n)return toast('请输入世界观名称');
    if(idx>=0&&cp.worldviews[idx]){cp.worldviews[idx].name=n;cp.worldviews[idx].description=d;}
    else cp.worldviews.push({name:n,description:d});
    sv();closeM('m-ff-wve');
    // Refresh worldview list in CP edit modal
    var el=document.getElementById('cpe-wv-list');
    if(el)el.innerHTML=_renderWvList(cp);
    toast(idx>=0?'世界观已更新':'世界观已添加');
};

window.ffDelWv=function(cid,idx){
    if(!confirm('删除此世界观？'))return;
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp||!cp.worldviews)return;
    cp.worldviews.splice(idx,1);sv();
    var el=document.getElementById('cpe-wv-list');
    if(el)el.innerHTML=_renderWvList(cp);
    toast('已删除');
};

// ===== CONTACT PICKER FOR CP =====
window.ffPickContact=function(charNum,cid){
    init();var contacts=store.contacts||[];
    if(!contacts.length)return toast('没有可用的联系人');
    var h='';
    for(var i=0;i<contacts.length;i++){var c=contacts[i];
        h+='<div onclick="ffSetCPContact(\''+cid+'\','+charNum+',\''+c.id+'\')" style="display:flex;align-items:center;gap:10px;padding:10px;background:#f9f9fb;border-radius:10px;margin-bottom:6px;cursor:pointer">';
        h+='<div style="width:36px;height:36px;border-radius:50%;background:#2BAE85;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px">'+escapeHtml((c.name||'?')[0])+'</div>';
        h+='<div><div style="font-weight:500">'+escapeHtml(c.name)+'</div>';
        h+='<div style="font-size:11px;color:#999">'+(c.persona?escapeHtml(c.persona.substring(0,40))+'...':'无人设')+'</div></div></div>';}
    var m=mkM('m-ff-cpick');
    m.innerHTML='<div class="ff-modal-overlay" onclick="closeM(\'m-ff-cpick\')"></div>'
        +'<div class="modal-box" style="max-width:380px;border-radius:16px;max-height:70vh;display:flex;flex-direction:column">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0">'
        +'<span style="font-size:16px;font-weight:600">选择联系人</span>'
        +'<span onclick="closeM(\'m-ff-cpick\')" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="flex:1;overflow-y:auto;padding:16px">'+h+'</div></div>';
    m.style.display='flex';
};

window.ffSetCPContact=function(cid,charNum,contactId){
    init();var cp=store.fanfic.cps.find(function(c){return c.id===cid;});if(!cp)return;
    var contact=(store.contacts||[]).find(function(c){return c.id===contactId;});if(!contact)return;
    if(charNum===1){cp.char1.contactId=contactId;cp.char1.name=contact.name;}
    else{cp.char2.contactId=contactId;cp.char2.name=contact.name;}
    sv();closeM('m-ff-cpick');toast('已关联');
    ffEditCP(cid); // refresh edit modal
};

// [FIX] 创建HTML中 modal-fanfic-generate 弹窗引用的 generateFanfic 函数
window.generateFanfic = async function() {
    if (!store.system || !store.system.key) return toast('请先配置API Key');
    var cpSelect = document.getElementById('fanfic-gen-cp');
    var genreSelect = document.getElementById('fanfic-gen-genre');
    var minWords = parseInt(document.getElementById('fanfic-gen-min').value) || 800;
    var maxWords = parseInt(document.getElementById('fanfic-gen-max').value) || 2000;
    var extra = (document.getElementById('fanfic-gen-extra').value || '').trim();

    var cpId = cpSelect ? cpSelect.value : '';
    var genre = genreSelect ? genreSelect.value : '甜宠日常';
    var cp = null;
    if (cpId && store.fanfic && store.fanfic.cps) {
        cp = store.fanfic.cps.find(function(c) { return c.id === cpId; });
    }
    if (!cp) return toast('请选择一个CP', 'error');

    var cpDesc = cp.char1.name + '×' + cp.char2.name;
    var char1Info = cp.char1.name + (cp.char1.traits ? '（' + cp.char1.traits + '）' : '');
    var char2Info = cp.char2.name + (cp.char2.traits ? '（' + cp.char2.traits + '）' : '');
    var wvInfo = '';
    if (cp.worldviews && cp.worldviews.length > 0) {
        wvInfo = '\n世界观设定：' + cp.worldviews.map(function(w) { return w.title + '：' + w.content; }).join('；');
    }

    document.getElementById('modal-fanfic-generate').style.display = 'none';
    toast('正在生成同人文，请稍候...', 'info');

    var sysPrompt = '你是一位优秀的同人文写手。请根据以下信息创作一篇同人文：\n' +
        (extra ? '\n【最重要！用户的创作要求，必须严格遵守，这是第一优先级】：' + extra + '\n\n' : '') +
        'CP：' + cpDesc + '\n' +
        '角色1：' + char1Info + '\n' +
        '角色2：' + char2Info + '\n' +
        '风格类型：' + genre + '\n' +
        // [FIX-字数] 强化字数要求
        '【字数硬性要求】：正文必须达到' + minWords + '字以上，严禁少于' + minWords + '字。要求范围' + minWords + '-' + maxWords + '字。请充分展开情节、对话和描写。\n' +
        wvInfo +
        '\n\n要求：\n1. 内容完整、情节丰富\n2. 人物性格鲜明，符合人设\n3. 文笔流畅，有文学性' +
        (extra ? '\n\n再次强调，必须严格遵守用户的创作要求：' + extra : '') +
        '\n\n【输出格式要求】请严格按以下格式输出：\n1. 第一行写标题（不要加"标题："前缀）\n2. 空一行后写完整正文（' + minWords + '-' + maxWords + '字）\n3. 正文写完后，最后另起一行输出：\n<!--META:{"tags":["标签1","标签2","标签3"],"comments":[{"user":"读者网名","text":"针对文章具体内容的评论"}]}-->\n标签3-5个，评论5-8条，评论必须针对文章具体情节和角色';

    try {
        // [FIX-一次生成] 合并文章+标签+评论为一次API调用
        var data = await window._ffApiCall([
            { role: 'system', content: sysPrompt },
            { role: 'user', content: '请创作一篇' + genre + '风格的' + cpDesc + '同人文（至少' + minWords + '字），并在正文末尾附上META标签和评论' }
        ], 0.9);
        var content = data.choices[0].message.content;
        if (!content) return toast('生成失败：内容为空', 'error');
        content = window._ffSanitizeContent(content.trim());

        // 解析META JSON块
        var storyTags = genre ? [genre] : [];
        var storyComments = [];
        var _metaM5 = content.match(/<!--META:([\s\S]*?)-->/);
        if (!_metaM5) _metaM5 = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (!_metaM5) _metaM5 = content.match(/(\{"tags"[\s\S]*?"comments"[\s\S]*?\})\s*$/);
        if (_metaM5) {
            try {
                var metaObj = JSON.parse(_metaM5[1]);
                if (metaObj.tags && Array.isArray(metaObj.tags)) storyTags = metaObj.tags;
                if (metaObj.comments && Array.isArray(metaObj.comments)) {
                    var _VA4 = window._ffVAuthors || [];
                    for (var mi = 0; mi < metaObj.comments.length; mi++) {
                        storyComments.push({user:metaObj.comments[mi].user||(_VA4.length>0?_VA4[Math.floor(Math.random()*_VA4.length)].name:'读者'),text:(metaObj.comments[mi].text||'好看！').substring(0,100),time:Date.now()-Math.floor(Math.random()*86400000*3)});
                    }
                }
            } catch(me) { console.warn('META JSON解析失败:', me); }
            content = content.replace(/<!--META:[\s\S]*?-->/,'').replace(/```json\s*\{[\s\S]*?\}\s*```\s*$/,'').replace(/\{"tags"[\s\S]*?"comments"[\s\S]*?\}\s*$/,'').trim();
        }

        if (!store.fanfic) window._ffInit();
        var _ext = window._ffExtractTitle(content, cpDesc + '·' + genre);
        var title = _ext.title;
        content = _ext.content;

        var eng = window._ffGenEng ? window._ffGenEng(storyTags, genre) : {likes:[],comments:[],views:0};
        if (storyComments.length === 0) storyComments = eng.comments;
        var story = {
            id: 'ff_' + Date.now(),
            title: title,
            genre: genre,
            summary: content.substring(0, 100) + '...',
            content: content,
            // [FIX-字数] 设置wordCount和coverColor
            wordCount: content.length,
            coverColor: window._ffRc ? window._ffRc() : '#2BAE85',
            author: (store.fanfic.settings && store.fanfic.settings.penName) || store.user.name || '匿名',
            authorAvatar: (store.fanfic.settings && store.fanfic.settings.avatar) || '',
            cover: window._ffRc ? window._ffRc() : '',
            isMe: true,
            status: 'published',
            cpId: cpId,
            time: Date.now(),
            likes: eng.likes,
            comments: storyComments,
            views: eng.views,
            tags: storyTags,
            userReq: extra || null
        };
        store.fanfic.stories.push(story);
        if (typeof saveStore === 'function') saveStore();
        else if (typeof save === 'function') save();
        toast('同人文生成成功！', 'success');
        if (typeof renderFanficHome === 'function') renderFanficHome();
    } catch (e) {
        console.error('generateFanfic error:', e);
        toast('生成失败：' + e.message, 'error');
    }
};

})();
// === FANFIC MODULE: Enhanced Features - Page Mode, Read Progress, Dynamic Authors/Activities ===
(function(){
'use strict';
var init=window._ffInit,VA=window._ffVAuthors,ACT=window._ffActivities;
function sv(){if(typeof save==='function')save();else try{localStorage.setItem('yan_store',JSON.stringify(store));}catch(e){}}

// ========== 1. READING PROGRESS MEMORY ==========
// Save reading position when scrolling
var _progressSaveTimer=null;
window._ffSaveReadProgress=function(sid,scrollTop,chapterIdx){
    init();
    if(!store.fanfic.readProgress)store.fanfic.readProgress={};
    store.fanfic.readProgress[sid]={scrollTop:scrollTop||0,ci:chapterIdx||0,time:Date.now()};
    sv();
};

// Override ffStartReader to restore progress
var _origStartReader=window.ffStartReader;
window.ffStartReader=function(sid,ci){
    init();
    if(!store.fanfic.readProgress)store.fanfic.readProgress={};
    // If ci is 0 and we have saved progress, restore it
    var saved=store.fanfic.readProgress[sid];
    if(ci===0&&saved&&saved.ci!==undefined){
        ci=saved.ci;
    }
    _origStartReader(sid,ci);
    // Restore scroll position after render
    if(saved&&saved.scrollTop){
        setTimeout(function(){
            var rc=document.getElementById('ff-reader-content');
            if(rc)rc.scrollTop=saved.scrollTop;
        },150);
    }
    // Attach scroll listener for saving progress
    setTimeout(function(){
        var rc=document.getElementById('ff-reader-content');
        if(rc){
            rc.addEventListener('scroll',function(){
                if(_progressSaveTimer)clearTimeout(_progressSaveTimer);
                _progressSaveTimer=setTimeout(function(){
                    var st=window._ffReaderState;
                    window._ffSaveReadProgress(st.sid,rc.scrollTop,st.ci);
                },500);
            });
        }
    },300);
};

// Also save progress when changing chapters
var _origReaderGo=window.ffReaderGo;
window.ffReaderGo=function(ci){
    var st=window._ffReaderState;
    window._ffSaveReadProgress(st.sid,0,ci);
    _origReaderGo(ci);
};

// ========== 1.5. BOOKMARK (手动标记) ==========
window.ffBookmarkCurrent=function(){
    init();
    var st=window._ffReaderState;
    if(!st.sid)return;
    if(!store.fanfic.bookmarks)store.fanfic.bookmarks={};
    var rc=document.getElementById('ff-reader-content');
    var scrollTop=rc?rc.scrollTop:0;
    var pageMode=window._ffGetPageMode?window._ffGetPageMode():'scroll';
    var pageIdx=(window._ffPagedState&&pageMode==='horizontal')?window._ffPagedState.currentPage:0;
    store.fanfic.bookmarks[st.sid]={ci:st.ci,scrollTop:scrollTop,page:pageIdx,time:Date.now()};
    sv();
    // 视觉反馈
    var btn=document.querySelector('.ff-bookmark-btn');
    if(btn){
        btn.querySelector('i').className='fas fa-map-marker-alt';
        btn.querySelector('i').style.color='#ff6b81';
        btn.querySelector('span').textContent='已标记';
        setTimeout(function(){
            if(btn.querySelector('span'))btn.querySelector('span').textContent='标记';
            if(btn.querySelector('i'))btn.querySelector('i').style.color='';
        },1500);
    }
    toast('已标记当前位置 📌');
};

// 获取书签
window._ffGetBookmark=function(sid){
    init();
    if(!store.fanfic.bookmarks)store.fanfic.bookmarks={};
    return store.fanfic.bookmarks[sid]||null;
};

// 修改ffStartReader：优先从书签恢复
var _origStartReaderBM=window.ffStartReader;
window.ffStartReader=function(sid,ci){
    init();
    if(!store.fanfic.bookmarks)store.fanfic.bookmarks={};
    var bm=store.fanfic.bookmarks[sid];
    // 如果ci为0且有书签，优先用书签位置
    if(ci===0&&bm&&bm.ci!==undefined){
        ci=bm.ci;
    }
    _origStartReaderBM(sid,ci);
    // 恢复书签的滚动位置
    if(bm&&bm.scrollTop){
        setTimeout(function(){
            var rc=document.getElementById('ff-reader-content');
            if(rc)rc.scrollTop=bm.scrollTop;
        },200);
    }
    // 恢复横向翻页的页码
    if(bm&&bm.page&&bm.page>0){
        setTimeout(function(){
            var ps=window._ffPagedState;
            if(ps&&ps.totalPages>bm.page){
                ps.currentPage=bm.page;
                var text=document.getElementById('ff-reader-text');
                if(text)text.style.transform='translateX(-'+(ps.currentPage*(ps.containerW+40))+'px)';
                var ind=document.getElementById('ff-page-indicator');
                if(ind)ind.textContent=(ps.currentPage+1)+'/'+ps.totalPages;
            }
        },400);
    }
};

// ========== 2. PAGE MODE (SCROLL / HORIZONTAL) ==========
window._ffGetPageMode=function(){
    init();
    if(!store.fanfic.readerSettings)store.fanfic.readerSettings={pageMode:'scroll'};
    return store.fanfic.readerSettings.pageMode||'scroll';
};
window._ffSetPageMode=function(mode){
    init();
    if(!store.fanfic.readerSettings)store.fanfic.readerSettings={};
    store.fanfic.readerSettings.pageMode=mode;
    sv();
};

// Override ffRenderReader to add page mode button and horizontal paging
var _origRenderReader=window.ffRenderReader;
window.ffRenderReader=function(){
    _origRenderReader();
    var pageMode=window._ffGetPageMode();
    // Add page mode button to bottom bar
    var bot=document.getElementById('ff-reader-bottom');
    if(bot){
        var bar=bot.querySelector('.ff-reader-bottom-bar');
        if(bar&&!bar.querySelector('.ff-pagemode-btn')){
            var modeIcon=pageMode==='scroll'?'fa-arrows-alt-v':'fa-arrows-alt-h';
            var modeLabel=pageMode==='scroll'?'竖读':'横读';
            var btn=document.createElement('div');
            btn.className='ff-reader-bottom-btn ff-pagemode-btn';
            btn.onclick=function(e){e.stopPropagation();ffShowPageModePicker();};
            btn.innerHTML='<i class="fas '+modeIcon+'"></i><span>'+modeLabel+'</span>';
            // Insert before the last child if exists
            var nightBtn=bar.querySelector('.ff-reader-bottom-btn:nth-child(3)');
            if(nightBtn)bar.insertBefore(btn,nightBtn);
            else bar.appendChild(btn);
        }
    }
    // Apply horizontal mode if needed
    if(pageMode==='horizontal'){
        _applyHorizontalMode();
    }
};

function _applyHorizontalMode(){
    var rc=document.getElementById('ff-reader-content');
    if(!rc)return;
    var text=document.getElementById('ff-reader-text');
    if(!text)return;
    rc.style.overflowY='hidden';
    rc.style.overflowX='hidden';
    rc.style.position='relative';
    // Calculate dimensions
    var containerH=rc.clientHeight-120;
    var containerW=rc.clientWidth-40;
    if(containerH<200)containerH=400;
    if(containerW<200)containerW=rc.clientWidth-20;
    // Wrap text in a clip container so columns are visible but clipped by wrapper
    var clipWrap=document.createElement('div');
    clipWrap.id='ff-paged-clip';
    clipWrap.style.cssText='width:'+containerW+'px;height:'+containerH+'px;overflow:hidden;position:relative;margin:0 auto;';
    text.parentNode.insertBefore(clipWrap,text);
    clipWrap.appendChild(text);
    // Apply column layout to text - NO overflow:hidden on text itself
    text.style.cssText='font-size:'+window._ffReaderState.fontSize+'px;color:'+window._ffReaderState.fontColor+';padding:0;margin:0;column-width:'+containerW+'px;column-gap:40px;column-fill:auto;height:'+containerH+'px;line-height:2;text-indent:2em;white-space:pre-wrap;word-break:break-word;font-family:"PingFang SC","Noto Serif SC",serif;transition:transform 0.3s ease;';
    // Force layout then calculate pages
    void text.offsetWidth;
    var pages=Math.max(1,Math.ceil(text.scrollWidth/(containerW+40)));
    window._ffPagedState={currentPage:0,totalPages:pages,containerW:containerW};
    // Add swipe controls
    var touchStartX=0,touchEndX=0,touchStartTime=0;
    rc.addEventListener('touchstart',function(e){touchStartX=e.changedTouches[0].screenX;touchStartTime=Date.now();},{passive:true});
    rc.addEventListener('touchend',function(e){
        touchEndX=e.changedTouches[0].screenX;
        var diff=touchStartX-touchEndX;
        var elapsed=Date.now()-touchStartTime;
        if(Math.abs(diff)>40&&elapsed<800){
            if(diff>0)_ffPageNext();
            else _ffPagePrev();
        }
    },{passive:true});
    // Click left/right areas
    rc.onclick=function(e){
        var rect=rc.getBoundingClientRect();
        var x=e.clientX-rect.left;
        var w=rect.width;
        if(x<w*0.3){_ffPagePrev();e.stopPropagation();}
        else if(x>w*0.7){_ffPageNext();e.stopPropagation();}
        else{ffReaderToggleMenu();}
    };
    // Page indicator
    var indicator=document.createElement('div');
    indicator.id='ff-page-indicator';
    indicator.style.cssText='position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:12px;color:#999;background:rgba(255,255,255,0.8);padding:2px 10px;border-radius:10px;z-index:5;';
    indicator.textContent='1/'+pages;
    rc.appendChild(indicator);
}

window._ffPageNext=function(){
    var ps=window._ffPagedState;if(!ps)return;
    if(ps.currentPage<ps.totalPages-1){
        ps.currentPage++;
        var text=document.getElementById('ff-reader-text');
        if(text)text.style.transform='translateX(-'+(ps.currentPage*(ps.containerW+40))+'px)';
        var ind=document.getElementById('ff-page-indicator');
        if(ind)ind.textContent=(ps.currentPage+1)+'/'+ps.totalPages;
    } else {
        // Go to next chapter
        var st=window._ffReaderState;
        var s=store.fanfic.stories.find(function(x){return x.id===st.sid;});
        if(s){
            var chs=window._ffParseChapters(s.content);
            if(st.ci<chs.length-1)ffReaderGo(st.ci+1);
        }
    }
};
window._ffPagePrev=function(){
    var ps=window._ffPagedState;if(!ps)return;
    if(ps.currentPage>0){
        ps.currentPage--;
        var text=document.getElementById('ff-reader-text');
        if(text)text.style.transform='translateX(-'+(ps.currentPage*(ps.containerW+40))+'px)';
        var ind=document.getElementById('ff-page-indicator');
        if(ind)ind.textContent=(ps.currentPage+1)+'/'+ps.totalPages;
    } else {
        // Go to previous chapter
        var st=window._ffReaderState;
        if(st.ci>0)ffReaderGo(st.ci-1);
    }
};

window.ffShowPageModePicker=function(){
    var cur=window._ffGetPageMode();
    var m=document.createElement('div');m.id='ff-pagemode-picker';m.className='ff-modal-wrap';
    m.innerHTML='<div class="modal-overlay" onclick="this.parentElement.remove()"></div>'
        +'<div class="modal-box" style="max-width:320px;border-radius:4px;">'
        +'<div style="padding:16px;font-size:16px;font-weight:600;color:#333;border-bottom:1px solid #f0f0f0">翻页方式</div>'
        +'<div style="padding:16px;display:flex;flex-direction:column;gap:10px">'
        +'<div onclick="window._ffSetPageMode(\'scroll\');this.closest(\'.ff-modal-wrap\').remove();ffRenderReader()" style="display:flex;align-items:center;gap:12px;padding:14px;background:'+(cur==='scroll'?'#e8f5f0':'#f9f9f9')+';border:2px solid '+(cur==='scroll'?'#2BAE85':'transparent')+';border-radius:4px;cursor:pointer">'
        +'<i class="fas fa-arrows-alt-v" style="font-size:20px;color:'+(cur==='scroll'?'#2BAE85':'#999')+'"></i>'
        +'<div><div style="font-weight:600;color:#333">竖向滚动</div><div style="font-size:12px;color:#999">上下滑动阅读</div></div></div>'
        +'<div onclick="window._ffSetPageMode(\'horizontal\');this.closest(\'.ff-modal-wrap\').remove();ffRenderReader()" style="display:flex;align-items:center;gap:12px;padding:14px;background:'+(cur==='horizontal'?'#e8f5f0':'#f9f9f9')+';border:2px solid '+(cur==='horizontal'?'#2BAE85':'transparent')+';border-radius:4px;cursor:pointer">'
        +'<i class="fas fa-arrows-alt-h" style="font-size:20px;color:'+(cur==='horizontal'?'#2BAE85':'#999')+'"></i>'
        +'<div><div style="font-weight:600;color:#333">左右翻页</div><div style="font-size:12px;color:#999">点击/滑动左右翻页</div></div></div>'
        +'</div></div>';
    document.body.appendChild(m);
};

// ========== 3. DYNAMIC AUTHORS (Preset + Random + Custom) ==========
var RANDOM_AUTHOR_NAMES=['云端小鸽','墨染青丝','荒野玫瑰','时光小站','北冥有鱼','南烛如风','晚风拂柳','雪落无声','碧海潮生','月华如练','清欢渡','故人归','半夏微凉','白茶清欢','长安故梦','浮世清欢','温酒斟茶','锦鲤抄','山河故人','梦里花落','拾光者','暮雪飞花','千秋岁','青灯古佛','浅墨低吟'];
var RANDOM_AUTHOR_STYLES=['温柔细腻','硬核热血','清新治愈','暗黑悬疑','搞笑日常','古风诗意','现代都市','甜到蛀牙','刀子选手','脑洞大开','氛围感强','沙雕搞笑','慢热型','快节奏','意识流'];
var RANDOM_AUTHOR_BIOS=['用文字治愈每一个灵魂','只写让人心动的故事','故事里有你我的影子','文字是最温柔的力量','脑洞比黑洞还大','每一个角色都值得被爱','专注虐心三十年','甜文制造机','用故事编织梦想','每篇都是心血之作','灵感来自生活','日更选手','深夜码字人','一支笔一个世界','梦想照进现实'];
var RANDOM_AUTHOR_AVATARS=['🌙','🌸','🔥','❄️','🌊','🍃','☀️','🌈','⚡','🦋','🌺','🎭','🎨','📝','🎵','💫','🌟','🍀','🦊','🐉','🦅','🌻','🍂','🌹','💎'];

function _genRandomAuthor(){
    var name=RANDOM_AUTHOR_NAMES[Math.floor(Math.random()*RANDOM_AUTHOR_NAMES.length)]+Math.floor(Math.random()*99);
    var style=RANDOM_AUTHOR_STYLES[Math.floor(Math.random()*RANDOM_AUTHOR_STYLES.length)];
    var bio=RANDOM_AUTHOR_BIOS[Math.floor(Math.random()*RANDOM_AUTHOR_BIOS.length)];
    var avatar=RANDOM_AUTHOR_AVATARS[Math.floor(Math.random()*RANDOM_AUTHOR_AVATARS.length)];
    var genres=window._ffGenres.filter(function(g){return g!=='全部';});
    var g1=genres[Math.floor(Math.random()*genres.length)],g2=genres[Math.floor(Math.random()*genres.length)];
    return{id:'va_rnd_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),name:name,style:style,avatar:avatar,bio:bio,genres:[g1,g2],isRandom:true};
}

// Generate mixed author list (preset + custom + random)
window._ffGetAllAuthors=function(){
    init();
    var preset=VA.slice();
    var custom=(store.fanfic.customAuthors||[]).map(function(a){a.isCustom=true;return a;});
    // Generate some random authors
    var randoms=[];
    for(var i=0;i<4;i++)randoms.push(_genRandomAuthor());
    return preset.concat(custom).concat(randoms);
};

// Pick a random author from all sources
window._ffPickRandomAuthor=function(){
    var all=window._ffGetAllAuthors();
    return all[Math.floor(Math.random()*all.length)];
};

// ========== 4. CUSTOM AUTHOR MANAGEMENT ==========
window.ffOpenAuthorManager=function(){
    init();
    if(!store.fanfic.customAuthors)store.fanfic.customAuthors=[];
    var allAuthors=window._ffGetAllAuthors();
    var fl=store.fanfic.follows||[];
    var h='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>👥 作者管理</span><div style="margin-left:auto;display:flex;gap:8px"><div onclick="ffRefreshAuthors()" style="width:32px;height:32px;border-radius:4px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff"><i class="fas fa-sync-alt"></i></div></div></div>';
    h+='<div class="ff-panel-body">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:15px;font-weight:600;color:#333">全部作者</span><button onclick="ffAddCustomAuthorForm()" style="padding:6px 14px;background:#2BAE85;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer"><i class="fas fa-plus"></i> 添加作者</button></div>';
    for(var i=0;i<allAuthors.length;i++){
        var v=allAuthors[i],isF=fl.indexOf(v.id)>-1;
        var tag=v.isCustom?'<span style="font-size:10px;color:#2BAE85;background:#e8f5f0;padding:1px 6px;border-radius:4px;margin-left:6px">自定义</span>':v.isRandom?'<span style="font-size:10px;color:#e67e22;background:#fef5e7;padding:1px 6px;border-radius:4px;margin-left:6px">随机</span>':'<span style="font-size:10px;color:#667eea;background:#eef2ff;padding:1px 6px;border-radius:4px;margin-left:6px">预设</span>';
        h+='<div style="display:flex;align-items:center;gap:12px;background:#fff;border-radius:4px;padding:14px;margin-bottom:10px;border:1px solid #e8e8e8">';
        h+='<div style="width:44px;height:44px;border-radius:4px;background:#2BAE85;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+v.avatar+'</div>';
        h+='<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:#333;display:flex;align-items:center;gap:6px">'+escapeHtml(v.name)+tag+'<span style="font-size:11px;color:#2BAE85;background:#e8f5f0;padding:1px 8px;border-radius:4px;font-weight:500">'+escapeHtml(v.style)+'</span></div>';
        h+='<div style="font-size:12px;color:#999;margin-top:3px">'+escapeHtml(v.bio||'')+'</div></div>';
        h+='<div style="display:flex;gap:6px;flex-shrink:0">';
        if(v.isCustom)h+='<button onclick="ffEditCustomAuthor(\''+v.id+'\')" style="width:28px;height:28px;border:none;background:#eef2ff;color:#667eea;border-radius:4px;cursor:pointer;font-size:12px"><i class="fas fa-edit"></i></button><button onclick="ffDeleteCustomAuthor(\''+v.id+'\')" style="width:28px;height:28px;border:none;background:#fff0f0;color:#e74c3c;border-radius:4px;cursor:pointer;font-size:12px"><i class="fas fa-trash-alt"></i></button>';
        h+='<button class="ff-follow-btn '+(isF?'followed':'')+'" onclick="ffToggleFollow(\''+v.id+'\')" style="padding:6px 12px;font-size:11px">'+(isF?'已关注':'关注')+'</button>';
        h+='</div></div>';
    }
    h+='</div>';
    var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-author-mgr';
    m.innerHTML=h;document.body.appendChild(m);
};

window.ffRefreshAuthors=function(){
    var el=document.getElementById('ff-author-mgr');if(el)el.remove();
    ffOpenAuthorManager();toast('作者列表已刷新');
};

window.ffAddCustomAuthorForm=function(eid){
    init();if(!store.fanfic.customAuthors)store.fanfic.customAuthors=[];
    var ex=null;if(eid)ex=store.fanfic.customAuthors.find(function(a){return a.id===eid;});
    var d=document.createElement('div');d.id='ff-author-form';d.className='ff-modal-wrap';
    d.innerHTML='<div class="modal-overlay" onclick="this.parentElement.remove()"></div>'
        +'<div class="modal-box" style="max-width:380px;border-radius:4px">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0"><span style="font-size:16px;font-weight:600">'+(ex?'编辑作者':'添加作者')+'</span><span onclick="this.closest(\'.ff-modal-wrap\').remove()" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="padding:16px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">作者名称</label>'
        +'<input id="ff-ca-name" value="'+escapeHtml(ex?ex.name:'')+'" placeholder="如：月下诗人" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">擅长文风</label>'
        +'<input id="ff-ca-style" value="'+escapeHtml(ex?ex.style:'')+'" placeholder="如：古风诗意" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">个人简介</label>'
        +'<input id="ff-ca-bio" value="'+escapeHtml(ex?ex.bio:'')+'" placeholder="如：用诗意描绘爱情" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">头像 (emoji)</label>'
        +'<input id="ff-ca-avatar" value="'+escapeHtml(ex?ex.avatar:'✍️')+'" placeholder="选一个emoji" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<div style="display:flex;gap:8px;margin-top:14px">'
        +'<button onclick="this.closest(\'.ff-modal-wrap\').remove()" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer">取消</button>'
        +'<button onclick="ffSaveCustomAuthor(\''+(eid||'')+'\')" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:4px;cursor:pointer">保存</button>'
        +'</div></div></div>';
    document.body.appendChild(d);
};

window.ffSaveCustomAuthor=function(eid){
    init();if(!store.fanfic.customAuthors)store.fanfic.customAuthors=[];
    var name=(document.getElementById('ff-ca-name').value||'').trim();
    var style=(document.getElementById('ff-ca-style').value||'').trim();
    var bio=(document.getElementById('ff-ca-bio').value||'').trim();
    var avatar=(document.getElementById('ff-ca-avatar').value||'').trim()||'✍️';
    if(!name)return toast('请输入作者名称');
    if(eid){
        var ex=store.fanfic.customAuthors.find(function(a){return a.id===eid;});
        if(ex){ex.name=name;ex.style=style;ex.bio=bio;ex.avatar=avatar;}
    }else{
        store.fanfic.customAuthors.push({id:'ca_'+Date.now(),name:name,style:style,avatar:avatar,bio:bio,genres:['现言','古言']});
    }
    sv();
    var el=document.getElementById('ff-author-form');if(el)el.remove();
    var mgr=document.getElementById('ff-author-mgr');if(mgr)mgr.remove();
    ffOpenAuthorManager();
    toast(eid?'作者已更新':'作者已添加');
};

window.ffEditCustomAuthor=function(aid){ffAddCustomAuthorForm(aid);};
window.ffDeleteCustomAuthor=function(aid){
    if(!confirm('删除此自定义作者？'))return;
    init();store.fanfic.customAuthors=(store.fanfic.customAuthors||[]).filter(function(a){return a.id!==aid;});
    sv();var mgr=document.getElementById('ff-author-mgr');if(mgr)mgr.remove();ffOpenAuthorManager();toast('已删除');
};

// ========== 5. DYNAMIC ACTIVITIES (Preset + Random + Custom) ==========
var RANDOM_ACT_POOL=[
    {title:'深夜食堂',desc:'写一个深夜暖心美食故事',reward:'美食家徽章',icon:'🍜',color:'#e67e22'},
    {title:'双向暗恋',desc:'两个人都喜欢对方但不知道',reward:'心心相印徽章',icon:'💘',color:'#e91e63'},
    {title:'穿越古今',desc:'穿越到古代/未来的奇遇',reward:'时空旅者边框',icon:'⏳',color:'#9b59b6'},
    {title:'校园怀旧',desc:'关于校园时光的温暖回忆',reward:'青春徽章',icon:'🎓',color:'#3498db'},
    {title:'末世生存',desc:'末日背景下的温情故事',reward:'末世勇者徽章',icon:'🏚️',color:'#34495e'},
    {title:'宿命之恋',desc:'命中注定的相遇与纠缠',reward:'红线缘分徽章',icon:'🧵',color:'#e74c3c'},
    {title:'职场暗战',desc:'办公室里的明争暗斗与暧昧',reward:'职场精英徽章',icon:'💼',color:'#2ecc71'},
    {title:'异世界冒险',desc:'在异世界的奇妙冒险',reward:'冒险者勋章',icon:'🗡️',color:'#f39c12'},
    {title:'治愈系日常',desc:'平凡日子里的小确幸',reward:'温暖守护者',icon:'🌻',color:'#27ae60'},
    {title:'悬疑推理',desc:'一个扑朔迷离的案件',reward:'名侦探徽章',icon:'🔍',color:'#2c3e50'}
];

function _genRandomActivity(){
    var pool=RANDOM_ACT_POOL[Math.floor(Math.random()*RANDOM_ACT_POOL.length)];
    return{id:'act_rnd_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),title:pool.title,desc:pool.desc,reward:pool.reward,icon:pool.icon,color:pool.color,isRandom:true};
}

window._ffGetAllActivities=function(){
    init();
    var preset=ACT.slice();
    var custom=(store.fanfic.customActivities||[]).map(function(a){a.isCustom=true;return a;});
    var randoms=[];
    for(var i=0;i<3;i++)randoms.push(_genRandomActivity());
    return preset.concat(custom).concat(randoms);
};

// ========== 6. CUSTOM ACTIVITY MANAGEMENT ==========
window.ffOpenActivityManager=function(){
    init();if(!store.fanfic.customActivities)store.fanfic.customActivities=[];
    var allActs=window._ffGetAllActivities();
    var h='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>🏆 活动管理</span><div style="margin-left:auto;display:flex;gap:8px"><div onclick="ffRefreshActivities()" style="width:32px;height:32px;border-radius:4px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff"><i class="fas fa-sync-alt"></i></div></div></div>';
    h+='<div class="ff-panel-body">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:15px;font-weight:600;color:#333">全部活动</span><button onclick="ffAddCustomActivityForm()" style="padding:6px 14px;background:#2BAE85;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer"><i class="fas fa-plus"></i> 发布活动</button></div>';
    for(var i=0;i<allActs.length;i++){
        var a=allActs[i];
        var tag=a.isCustom?'<span style="font-size:10px;color:#2BAE85;background:#e8f5f0;padding:1px 6px;border-radius:4px">自定义</span>':a.isRandom?'<span style="font-size:10px;color:#e67e22;background:#fef5e7;padding:1px 6px;border-radius:4px">随机</span>':'<span style="font-size:10px;color:#667eea;background:#eef2ff;padding:1px 6px;border-radius:4px">预设</span>';
        h+='<div style="display:flex;align-items:center;gap:12px;background:#fff;border-radius:4px;padding:14px;margin-bottom:10px;border-left:4px solid '+a.color+';border:1px solid #e8e8e8;border-left:4px solid '+a.color+'">';
        h+='<div style="width:44px;height:44px;border-radius:4px;background:'+a.color+'22;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+a.icon+'</div>';
        h+='<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:#333;display:flex;align-items:center;gap:6px">'+escapeHtml(a.title)+' '+tag+'</div>';
        h+='<div style="font-size:12px;color:#888;margin-top:2px">'+escapeHtml(a.desc)+'</div>';
        h+='<div style="font-size:11px;color:#f39c12;margin-top:2px">🎁 '+escapeHtml(a.reward)+'</div></div>';
        h+='<div style="display:flex;gap:6px;flex-shrink:0">';
        if(a.isCustom)h+='<button onclick="ffDeleteCustomActivity(\''+a.id+'\')" style="width:28px;height:28px;border:none;background:#fff0f0;color:#e74c3c;border-radius:4px;cursor:pointer;font-size:12px"><i class="fas fa-trash-alt"></i></button>';
        h+='<button onclick="ffJoinActivity(\''+a.id+'\')" style="padding:6px 12px;background:#2BAE85;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer">参加</button>';
        h+='</div></div>';
    }
    h+='</div>';
    var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-act-mgr';
    m.innerHTML=h;document.body.appendChild(m);
};

window.ffRefreshActivities=function(){
    var el=document.getElementById('ff-act-mgr');if(el)el.remove();
    ffOpenActivityManager();toast('活动列表已刷新');
};

window.ffAddCustomActivityForm=function(){
    var d=document.createElement('div');d.id='ff-act-form';d.className='ff-modal-wrap';
    var icons=['🎯','🌟','💫','🎪','🎭','📖','🎉','🏅','🎨','🔥'];
    var iH='';for(var i=0;i<icons.length;i++)iH+='<span onclick="document.getElementById(\'ff-cact-icon\').value=\''+icons[i]+'\'" style="font-size:20px;cursor:pointer;padding:4px;border-radius:4px;background:#f9f9f9">'+icons[i]+'</span>';
    d.innerHTML='<div class="modal-overlay" onclick="this.parentElement.remove()"></div>'
        +'<div class="modal-box" style="max-width:380px;border-radius:4px">'
        +'<div style="display:flex;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0"><span style="font-size:16px;font-weight:600">发布活动</span><span onclick="this.closest(\'.ff-modal-wrap\').remove()" style="font-size:22px;color:#999;cursor:pointer">×</span></div>'
        +'<div style="padding:16px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">活动名称</label>'
        +'<input id="ff-cact-title" placeholder="如：夏日冒险" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">活动说明</label>'
        +'<input id="ff-cact-desc" placeholder="如：写一个夏日冒险故事" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">奖励描述</label>'
        +'<input id="ff-cact-reward" placeholder="如：冒险者徽章" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
        +'<label style="font-size:13px;color:#555;display:block;margin-bottom:6px">图标</label>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+iH+'</div>'
        +'<input id="ff-cact-icon" value="🎯" style="width:60px;padding:10px;border:1px solid #e0e0e0;border-radius:4px;font-size:18px;text-align:center;margin-bottom:12px">'
        +'<div style="display:flex;gap:8px;margin-top:14px">'
        +'<button onclick="this.closest(\'.ff-modal-wrap\').remove()" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer">取消</button>'
        +'<button onclick="ffSaveCustomActivity()" style="flex:1;padding:10px;border:none;background:#2BAE85;color:#fff;border-radius:4px;cursor:pointer">发布</button>'
        +'</div></div></div>';
    document.body.appendChild(d);
};

window.ffSaveCustomActivity=function(){
    init();if(!store.fanfic.customActivities)store.fanfic.customActivities=[];
    var title=(document.getElementById('ff-cact-title').value||'').trim();
    var desc=(document.getElementById('ff-cact-desc').value||'').trim();
    var reward=(document.getElementById('ff-cact-reward').value||'').trim();
    var icon=(document.getElementById('ff-cact-icon').value||'').trim()||'🎯';
    if(!title)return toast('请输入活动名称');
    var colors=['#2BAE85','#3498db','#e67e22','#9b59b6','#1abc9c','#2980b9','#e74c3c','#f39c12'];
    store.fanfic.customActivities.push({id:'cact_'+Date.now(),title:title,desc:desc||'自定义活动',reward:reward||'参与奖',icon:icon,color:colors[Math.floor(Math.random()*colors.length)]});
    sv();
    var el=document.getElementById('ff-act-form');if(el)el.remove();
    var mgr=document.getElementById('ff-act-mgr');if(mgr)mgr.remove();
    ffOpenActivityManager();
    toast('活动已发布！');
};

window.ffDeleteCustomActivity=function(aid){
    if(!confirm('删除此活动？'))return;
    init();store.fanfic.customActivities=(store.fanfic.customActivities||[]).filter(function(a){return a.id!==aid;});
    sv();var mgr=document.getElementById('ff-act-mgr');if(mgr)mgr.remove();ffOpenActivityManager();toast('已删除');
};

// ========== 7. OVERRIDE DISCOVER PAGE - Use dynamic activities & authors ==========
// Override rFollow to show all authors (preset + custom + random)
var _origRFollow=null; // We override by patching the tab rendering

// Override the follow tab rendering
var _origSwitchTab=window.ffSwitchTab;
window.ffSwitchTab=function(t){
    _origSwitchTab(t);
    if(t==='follow'){
        setTimeout(function(){
            var b=document.getElementById('ff-body');
            if(!b)return;
            _renderFollowEnhanced(b);
        },50);
    }
};

function _renderFollowEnhanced(b){
    init();
    var allAuthors=window._ffGetAllAuthors();
    var fl=store.fanfic.follows||[];
    var h='<div class="ff-sec-header2" style="padding-top:16px"><div class="ff-sec-title2">👥 作者广场</div><div class="ff-sec-more2" onclick="ffRefreshFollowPage()"><i class="fas fa-sync-alt"></i> 换一批</div></div>';
    h+='<div style="padding:0 16px 8px"><button onclick="ffOpenAuthorManager()" style="width:100%;padding:10px;background:#2BAE85;color:#fff;border:none;border-radius:4px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px"><i class="fas fa-cog"></i> 管理作者 / 添加自定义作者</button></div>';
    h+='<div class="ff-va-list">';
    for(var i=0;i<allAuthors.length;i++){
        var v=allAuthors[i],isF=fl.indexOf(v.id)>-1;
        var tag=v.isCustom?'<span style="font-size:10px;color:#2BAE85;background:#e8f5f0;padding:1px 6px;border-radius:4px;margin-left:4px">自定义</span>':v.isRandom?'<span style="font-size:10px;color:#e67e22;background:#fef5e7;padding:1px 6px;border-radius:4px;margin-left:4px">随机</span>':'';
        h+='<div class="ff-va-card"><div class="ff-va-avatar">'+v.avatar+'</div><div class="ff-va-info"><div class="ff-va-name">'+escapeHtml(v.name)+tag+' <span class="ff-va-style">'+escapeHtml(v.style)+'</span></div><div class="ff-va-bio">'+escapeHtml(v.bio||'')+'</div></div><button class="ff-follow-btn '+(isF?'followed':'')+'" onclick="ffToggleFollow(\''+v.id+'\');">'+(isF?'已关注':'关注')+'</button></div>';
    }
    h+='</div>';
    b.innerHTML=h;
}

window.ffRefreshFollowPage=function(){
    var b=document.getElementById('ff-body');
    if(b)_renderFollowEnhanced(b);
    toast('已刷新作者列表');
};

// ========== 8. OVERRIDE ACTIVITIES PAGE - Use dynamic activities ==========
var _origOpenActivities=window.ffOpenActivities;
window.ffOpenActivities=function(){
    init();
    var allActs=window._ffGetAllActivities();
    var m=document.createElement('div');m.className='ff-overlay-panel';m.id='ff-activities';
    var h='<div class="ff-panel-header"><div class="ff-panel-back" onclick="this.closest(\'.ff-overlay-panel\').remove()"><i class="fas fa-chevron-left"></i></div><span>🏆 主题活动</span><div style="margin-left:auto;display:flex;gap:8px"><div onclick="ffRefreshActivityPage()" style="width:32px;height:32px;border-radius:4px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff"><i class="fas fa-sync-alt"></i></div></div></div><div class="ff-panel-body">';
    h+='<div style="margin-bottom:12px"><button onclick="ffAddCustomActivityForm()" style="width:100%;padding:10px;background:#2BAE85;color:#fff;border:none;border-radius:4px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px"><i class="fas fa-plus"></i> 发布自定义活动</button></div>';
    for(var i=0;i<allActs.length;i++){
        var a=allActs[i];
        var tag=a.isCustom?' <span style="font-size:10px;color:#2BAE85;background:#e8f5f0;padding:1px 6px;border-radius:4px">我发布的</span>':a.isRandom?' <span style="font-size:10px;color:#e67e22;background:#fef5e7;padding:1px 6px;border-radius:4px">限时</span>':'';
        h+='<div class="ff-act-detail-card" style="border-left:4px solid '+a.color+'"><div class="ff-act-detail-icon" style="background:'+a.color+'22">'+a.icon+'</div><div class="ff-act-detail-info"><div class="ff-act-detail-title">'+escapeHtml(a.title)+tag+'</div><div class="ff-act-detail-desc">'+escapeHtml(a.desc)+'</div><div class="ff-act-detail-reward">🎁 '+escapeHtml(a.reward)+'</div></div><button class="ff-btn-primary2 ff-btn-sm" onclick="ffJoinActivity(\''+a.id+'\')">参加</button></div>';
    }
    h+='</div>';m.innerHTML=h;document.body.appendChild(m);
};

window.ffRefreshActivityPage=function(){
    var el=document.getElementById('ff-activities');if(el)el.remove();
    ffOpenActivities();toast('活动已刷新');
};

// Override ffJoinActivity to also support custom activities
var _origJoinActivity=window.ffJoinActivity;
window.ffJoinActivity=function(aid){
    var allActs=window._ffGetAllActivities();
    var a=allActs.find(function(x){return x.id===aid;});
    if(!a){
        // Try original ACT
        a=ACT.find(function(x){return x.id===aid;});
    }
    if(!a)return toast('活动不存在');
    var el=document.getElementById('ff-activities');if(el)el.remove();
    openFanficWriteNew();
    setTimeout(function(){var ti=document.getElementById('ff-write-title');if(ti){ti.value='【'+a.title+'】';ti.placeholder=a.desc;}},100);
    toast('已加入活动: '+a.title);
};

// ========== 9. OVERRIDE DISCOVER - Dynamic activity banners & diverse authors ==========
// Override the activity banner in discover to use dynamic activities
var _origRenderFanficHome=window.renderFanficHome;
window.renderFanficHome=function(){
    _origRenderFanficHome();
    // Replace activity banners with dynamic ones
    setTimeout(function(){
        var banners=document.querySelectorAll('.ff-act-card2');
        if(banners.length>0){
            var allActs=window._ffGetAllActivities();
            // Shuffle
            for(var s=allActs.length-1;s>0;s--){var j=Math.floor(Math.random()*(s+1));var tmp=allActs[s];allActs[s]=allActs[j];allActs[j]=tmp;}
            for(var i=0;i<banners.length&&i<allActs.length;i++){
                var a=allActs[i];
                var b=banners[i];
                b.style.background=a.color+'15';
                b.style.borderLeft='3px solid '+a.color;
                b.onclick=(function(aid){return function(){ffJoinActivity(aid);};})(a.id);
                var iconEl=b.querySelector('.ff-act-card2-icon');
                if(iconEl)iconEl.textContent=a.icon;
                var infoEl=b.querySelector('.ff-act-card2-info');
                if(infoEl){
                    var divs=infoEl.querySelectorAll('div');
                    if(divs[0])divs[0].textContent=a.title;
                    var rewardEl=infoEl.querySelector('.ff-act-card2-reward');
                    if(rewardEl)rewardEl.textContent='🎁 '+a.reward;
                }
            }
        }
    },100);
};

// ========== 10. OVERRIDE GENERATE TO USE DIVERSE AUTHORS ==========
// Patch ffGenerateRecommended to pick from all authors
var _origGenRec=window.ffGenerateRecommended;
window.ffGenerateRecommended=async function(){
    init();if(!store.system||!store.system.key)return toast('请先配置API Key');
    toast('AI创作中...');
    try{
        var gs=window._ffGenres.filter(function(g){return g!=='全部';}),g=gs[Math.floor(Math.random()*gs.length)];
        var ts=window._ffTags,t1=ts[Math.floor(Math.random()*ts.length)],t2=ts[Math.floor(Math.random()*ts.length)];
        var va=window._ffPickRandomAuthor();
        var styleHint=va.style?'，文风偏向'+va.style:'';
        // [FIX-一次生成] 合并文章+标签+评论为一次API调用
        var d=await window._ffApiCall([{role:'user',content:'你是同人文作者"'+va.name+'"'+styleHint+'。写一篇'+g+'类型同人短文，标签：'+t1+'、'+t2+'。\n【字数硬性要求】：正文必须达到2000字以上，严禁少于2000字。要求范围2000-4000字。要有完整情节、丰富对话和细腻描写。\n\n【输出格式要求】请严格按以下格式输出，先写完整正文，最后附上JSON元数据：\n1. 第一行写标题（不要加"标题："前缀）\n2. 空一行后写完整正文（2000-4000字）\n3. 正文写完后，最后另起一行输出一个JSON块，格式如下：\n<!--META:{"tags":["'+t1+'","'+t2+'","标签3"],"comments":[{"user":"读者网名","text":"针对文章具体内容的评论"},{"user":"读者网名","text":"评论"}]}-->\n标签要求：3-5个，必须包含'+t1+'和'+t2+'\n评论要求：5-8条，必须针对文章的具体情节和角色，像真实读者，长短不一，可用颜文字emoji'}],0.95);
        var tx=(d.choices[0].message.content||'').trim();
        tx=window._ffSanitizeContent(tx);
        // 解析META JSON块
        var _rTags4=[t1,t2];var _rComments4=[];
        var _metaMatch4=tx.match(/<!--META:([\s\S]*?)-->/);
        if(!_metaMatch4)_metaMatch4=tx.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if(!_metaMatch4)_metaMatch4=tx.match(/(\{"tags"[\s\S]*?"comments"[\s\S]*?\})\s*$/);
        if(_metaMatch4){
            try{var _mo4=JSON.parse(_metaMatch4[1]);
                if(_mo4.tags&&Array.isArray(_mo4.tags))_rTags4=_mo4.tags;
                if(_mo4.comments&&Array.isArray(_mo4.comments)){var _v4=window._ffVAuthors||[];for(var _i4=0;_i4<_mo4.comments.length;_i4++){_rComments4.push({user:_mo4.comments[_i4].user||(_v4.length>0?_v4[Math.floor(Math.random()*_v4.length)].name:'读者'),text:(_mo4.comments[_i4].text||'好看').substring(0,100),time:Date.now()-Math.floor(Math.random()*86400000*3)});}}
            }catch(_e4){console.warn('META JSON解析失败:',_e4);}
            tx=tx.replace(/<!--META:[\s\S]*?-->/,'').replace(/```json\s*\{[\s\S]*?\}\s*```\s*$/,'').replace(/\{"tags"[\s\S]*?"comments"[\s\S]*?\}\s*$/,'').trim();
        }
        if(_rComments4.length===0){var eng=window._ffGenEng(_rTags4,g);_rComments4=eng.comments;}
        var _ext=window._ffExtractTitle(tx,'推荐作品'),ti=_ext.title,co=_ext.content;
        var _engL4=window._ffGenEng(_rTags4,g);
        store.fanfic.stories.push({id:'ff_'+Date.now(),title:ti,summary:co.substring(0,60),content:co,genre:g,author:va.name,coverColor:window._ffRc(),wordCount:co.length,time:Date.now(),likes:_engL4.likes,comments:_rComments4,views:_engL4.views||Math.floor(Math.random()*500)+50,status:'published',tags:_rTags4,isMe:false});
        sv();renderFanficHome();toast('新作品已生成！');
    }catch(e){toast('失败: '+e.message);}
};

// ========== 11. ADD AUTHOR/ACTIVITY MANAGER TO CREATE MENU ==========
var _origShowCreateMenu=window.ffShowCreateMenu;
window.ffShowCreateMenu=function(){
    _origShowCreateMenu();
    // Add new menu items
    setTimeout(function(){
        var grid=document.querySelector('.ff-cmenu-grid');
        if(!grid)return;
        // Add Author Manager
        var a1=document.createElement('div');a1.className='ff-cmenu-item';
        a1.onclick=function(){var el=this.closest('.ff-create-menu-overlay');if(el)el.remove();ffOpenAuthorManager();};
        a1.innerHTML='<div class="ff-cmenu-icon" style="background:linear-gradient(135deg,#667eea,#764ba2)"><i class="fas fa-users"></i></div><span>作者管理</span>';
        grid.appendChild(a1);
        // Add Activity Manager
        var a2=document.createElement('div');a2.className='ff-cmenu-item';
        a2.onclick=function(){var el=this.closest('.ff-create-menu-overlay');if(el)el.remove();ffOpenActivityManager();};
        a2.innerHTML='<div class="ff-cmenu-icon" style="background:linear-gradient(135deg,#e74c3c,#c0392b)"><i class="fas fa-calendar-alt"></i></div><span>活动管理</span>';
        grid.appendChild(a2);
    },50);
};

// ========== 12. FIX: Override TOC to jump to chapter in reader (not detail page) ==========
// The TOC in book detail already works correctly via ffStartReader
// But when clicking TOC in reader, make sure it jumps properly
// Already implemented via ffOpenTOC -> ffReaderGo, which is correct.

// ========== 13. GENERATE ARTICLES WITH CHAPTERS ==========
// Override AI generation to produce chaptered content
var _origGenForCP2=window._doGenCP;
// We don't need to override since the prompt already asks for content.
// The chapters are parsed via _ffParseChapters which handles 第X章 markers.

})();


