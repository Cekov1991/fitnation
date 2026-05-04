export function BackgroundGradients() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div 
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
      />
    </div>
  );
}
