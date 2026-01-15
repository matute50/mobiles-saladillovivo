function MobileNewsCard({ news, isFeatured, onClick, isDark }: any) {
  return (
    <div onClick={onClick} className={cn(
      "relative overflow-hidden rounded-xl shadow-sm shrink-0 active:scale-[0.98] transition-transform", 
      isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-neutral-200", 
      isFeatured ? "w-full h-full" : "w-[49%] h-full"
    )}>
      <div className="relative w-full h-full">
        <Image src={news.imagen || '/placeholder.png'} alt={news.titulo} fill className="object-cover opacity-90" />
        <div className={cn("absolute inset-0 bg-gradient-to-t z-10", isDark ? "from-black via-black/60 to-transparent" : "from-black/90 via-black/50 to-transparent")} />
        
        {/* Ajuste de padding y alineación para evitar desbordes */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-4 text-center">
            <div className={cn(
              "flex items-center justify-center rounded-full bg-[#003399]/50 backdrop-blur-sm border border-white/20 mb-2", 
              isFeatured ? "p-3" : "p-2" // Reducido ligeramente para ganar espacio
            )}>
                <Play size={isFeatured ? 28 : 20} fill="white" className="text-white ml-1"/>
            </div>

            {/* AJUSTE FINAL: 
                - Featured: Bajamos de text-2xl a text-xl y leading-[1.1]
                - Normal: text-[13px] y leading-[1.1]
            */}
            <h3 className={cn(
              "text-white font-black uppercase tracking-tight text-balance", 
              isFeatured ? "text-xl leading-[1.1] line-clamp-3" : "text-[13px] leading-[1.1] line-clamp-4"
            )}>
              {news.titulo}
            </h3>
        </div>
      </div>
    </div>
  );
}