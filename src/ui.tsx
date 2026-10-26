import { motion } from 'motion/react'

export function UI({
  sound,
  structure,
  onSound,
  onStructure,
  onFullscreen,
}:{
  sound:boolean
  structure:boolean
  onSound:()=>void
  onStructure:()=>void
  onFullscreen:()=>void
}){
  return <div className="ui">
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" />
        <b>WANXIANG</b>
        <span className="brand-cn">/ 湾区万象</span>
      </div>
      <div className="actions">
        <button className={sound?'icon active':'icon'} onClick={onSound} aria-label={sound?'关闭声音':'开启声音'}>
          <svg viewBox="0 0 24 24"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/>{sound&&<path d="M16 9.2c.9.75 1.4 1.7 1.4 2.8s-.5 2.05-1.4 2.8M18.5 6.8c1.55 1.35 2.4 3.05 2.4 5.2s-.85 3.85-2.4 5.2"/>}</svg>
        </button>
        <button className={structure?'icon active':'icon'} onClick={onStructure} aria-label="观其工">
          <svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z"/><path d="m5 10 7-5 7 5M5 14l7 5 7-5M12 5v14"/></svg>
        </button>
        <button className="icon" onClick={onFullscreen} aria-label="全屏">
          <svg viewBox="0 0 24 24"><path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/></svg>
        </button>
      </div>
    </header>

    <motion.section
      className="chapter"
      initial={{opacity:0,y:14}}
      animate={{opacity:1,y:0}}
      transition={{duration:.8,ease:[.16,1,.3,1]}}
    >
      <span>03</span>
      <h1>狮</h1>
      <p>佛山醒狮</p>
    </motion.section>

    <div className="hint"><i/>轻击 · 醒狮</div>
    <div className="look">DRAG TO LOOK</div>

    {structure&&<motion.aside className="structure-copy" initial={{opacity:0,x:12}} animate={{opacity:1,x:0}}>
      <strong>观其工</strong>
      <span>竹篾成骨 · 纸绸覆面 · 彩绘赋神</span>
    </motion.aside>}

    <nav className="rail" aria-label="章节">
      <button disabled>01 绣</button><i/>
      <button disabled>02 戏</button><i/>
      <button className="active">03 狮</button><i/>
      <button disabled>终章</button>
    </nav>
  </div>
}
