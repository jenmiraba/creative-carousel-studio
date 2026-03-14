const Header = () => (
  <header className="flex items-center gap-3.5 mb-10">
    <div className="w-[42px] h-[42px] bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-xl shrink-0">
      ⚡
    </div>
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Carousel Studio</h1>
      <p className="text-xs text-muted-foreground font-mono mt-0.5">myds_journey · Jennifer Miraballes</p>
    </div>
    <span className="ml-auto bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase">
      v2.0
    </span>
  </header>
);

export default Header;
