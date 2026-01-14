{/* MODAL DECRETO (VERSION REPARADA) */}
      {isInfoModalOpen && (
        <div 
          className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md" 
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div 
            className={cn(
              "relative w-full max-w-md p-5 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col items-center", 
              isDark ? "bg-neutral-900 text-white border border-white/10" : "bg-white text-neutral-900"
            )} 
            onClick={(e) => e.stopPropagation()}
          >
             {/* BOTÓN CERRAR GRANDE */}
             <button 
               onClick={() => setIsInfoModalOpen(false)} 
               className="absolute top-2 right-2 p-2 opacity-80 hover:opacity-100 bg-black/10 rounded-full transition-all z-[501]"
             >
               <X size={32} />
             </button>
             
             <div className="flex flex-col items-center w-full pt-4">
                <p className="text-[13px] font-black text-center mb-6 uppercase tracking-widest leading-tight">
                  Declarado de interés cultural<br/>
                  <span style={{ color: linkColor }} className="text-[11px] opacity-80">DECRETO H.C.D. Nro. 37/2022</span>
                </p>
                
                {/* CONTENEDOR DE IMAGEN FORZADO */}
                <div className="w-full relative bg-white rounded-lg shadow-inner overflow-hidden border border-neutral-200">
                  <img 
                    src="/DECRETO.png?v=1" 
                    alt="Decreto HCD" 
                    className="w-full h-auto block min-h-[100px]"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                    onLoad={() => console.log("Imagen DECRETO.png cargada con éxito")}
                    onError={(e) => {
                      console.error("Error cargando DECRETO.png");
                      const target = e.target as HTMLImageElement;
                      // Intento de rescate si el servidor lo sirve en minúsculas
                      if (!target.src.includes('decreto.png')) {
                        target.src = '/decreto.png';
                      }
                    }}
                  />
                </div>
             </div>
          </div>
        </div>
      )}