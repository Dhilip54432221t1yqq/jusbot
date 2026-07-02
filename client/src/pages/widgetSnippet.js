// Generates the embeddable WhatsApp Widget script string
export function buildSnippet(cfg) {
    const pos = cfg.position.split("-");
    const vp = pos[0];
    const hp = pos[1];
    const sz = { small: 52, medium: 64, large: 76 }[cfg.size] || 64;
    const fontUrl = "https://fonts.googleapis.com/css2?family=" + cfg.font.replace(/ /g, "+") + ":wght@400;600;700&display=swap";
    const waLink = "https://wa.me/" + cfg.phone + "?text=" + encodeURIComponent(cfg.prefilledText);

    const css = [
        "@import url(\"" + fontUrl + "\");",
        "#jb-wa-wrap{position:fixed;" + vp + ":24px;" + hp + ":24px;z-index:9999;font-family:\"" + cfg.font + "\",sans-serif}",
        "#jb-wa-btn{width:" + sz + "px;height:" + sz + "px;border-radius:50%;background:" + cfg.bubbleColor + ";display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:transform .2s;border:none}",
        "#jb-wa-btn:hover{transform:scale(1.08)}",
        "#jb-wa-btn svg{width:" + (sz * 0.44) + "px;height:" + (sz * 0.44) + "px;fill:#fff}",
        "#jb-wa-box{position:absolute;" + vp + ":calc(100% + 12px);" + hp + ":0;width:300px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.15);display:none;flex-direction:column}",
        "#jb-wa-box.open{display:flex}",
        "#jb-wa-hd{background:" + cfg.headerColor + ";padding:14px 16px;display:flex;align-items:center;gap:10px}",
        "#jb-wa-av{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0}",
        "#jb-wa-hd-t h4{margin:0;color:#fff;font-size:14px;font-weight:700}",
        "#jb-wa-hd-t p{margin:2px 0 0;color:rgba(255,255,255,.75);font-size:11px}",
        "#jb-wa-cls{margin-left:auto;background:none;border:none;color:#fff;cursor:pointer;font-size:20px;line-height:1;padding:0}",
        "#jb-wa-body{padding:14px;background:#ece5dd}",
        "#jb-wa-msg{background:#fff;border-radius:10px;border-top-left-radius:2px;padding:10px 12px;font-size:13px;color:#333;line-height:1.5;box-shadow:0 1px 3px rgba(0,0,0,.08)}",
        "#jb-wa-cta{display:flex;align-items:center;justify-content:center;gap:6px;margin:0 12px 12px;padding:11px;background:" + cfg.ctaColor + ";color:" + cfg.textColor + ";border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;font-family:\"" + cfg.font + "\",sans-serif}",
    ].join(" ");

    const lines = [
        "<!-- WhatsApp Widget by JusBot -->",
        "<script>",
        "(function(){",
        "var s=document.createElement('style');",
        "s.textContent=" + JSON.stringify(css) + ";",
        "document.head.appendChild(s);",
        "var b=document.createElement('div');",
        "b.id='jb-wa-wrap';",
        "b.innerHTML=" + JSON.stringify(
            '<button id="jb-wa-btn"><svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.524 5.845L0 24l6.374-1.498A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.062 16.5c-.254.714-1.494 1.365-2.038 1.443-.517.073-1.171.104-1.887-.119a17.21 17.21 0 01-1.706-.634C9.671 16.007 7.99 13.55 7.864 13.384c-.127-.167-1.031-1.372-1.031-2.618 0-1.246.654-1.859.886-2.113.233-.254.508-.317.678-.317l.487.008c.156.007.366-.059.573.437.212.508.719 1.754.782 1.881.063.127.106.276.021.444-.085.169-.127.276-.254.424-.127.148-.267.33-.381.444-.127.127-.259.264-.112.518.148.254.656 1.082 1.409 1.752.967.862 1.782 1.128 2.036 1.254.254.127.403.106.551-.063.148-.169.636-.742.806-1 .169-.254.339-.212.572-.127.233.085 1.479.698 1.733.825.254.127.424.19.487.296.063.106.063.614-.191 1.328z"/></svg></button>'
            + '<div id="jb-wa-box"><div id="jb-wa-hd"><div id="jb-wa-av">' + cfg.brandAvatar + '</div><div id="jb-wa-hd-t"><h4>' + cfg.brandName + "</h4><p>" + cfg.brandSubtitle + '</p></div><button id="jb-wa-cls">&#x2715;</button></div>'
            + '<div id="jb-wa-body"><div id="jb-wa-msg">' + cfg.welcomeMsg + "</div></div>"
            + '<a id="jb-wa-cta" href="' + waLink + '" target="_blank">&#128172; Start WhatsApp Chat</a></div>'
        ) + ";",
        "document.body.appendChild(b);",
        "var box=document.getElementById('jb-wa-box');",
        "document.getElementById('jb-wa-btn').addEventListener('click',function(){box.classList.toggle('open');});",
        "document.getElementById('jb-wa-cls').addEventListener('click',function(e){e.stopPropagation();box.classList.remove('open');});",
        cfg.showOnLoad ? "setTimeout(function(){box.classList.add('open');}," + ((cfg.popupDelay || 0) * 1000) + ");" : "",
        "})();",
        "<\/script>",
    ];
    return lines.filter(Boolean).join("\n");
}
