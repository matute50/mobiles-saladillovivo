// Reemplaza el useEffect de carga inicial en MobileLayout.tsx
  const { toggleMute, unmute, isMuted } = useVolume();

  useEffect(() => {
    if (data && mounted) {
      const newsId = searchParams.get('id');
      const videoId = searchParams.get('v');
      const allVideos = data.videos?.allVideos || [];
      
      let target: Video | Article | undefined;

      if (newsId) {
        const allArticles = [
          ...(data.articles?.featuredNews ? [data.articles.featuredNews] : []),
          ...(data.articles?.secondaryNews || []),
          ...(data.articles?.otherNews || [])
        ];
        target = allArticles.find(n => String(n.id) === newsId);
      } 
      else if (videoId) {
        target = allVideos.find(v => String(v.id) === videoId);
      }

      if (target) {
        // Obligatorio: Muted = true para que el navegador permita el Autoplay
        if (!isMuted) toggleMute(); 
        
        // Al primer toque del usuario en la pantalla, activamos sonido
        const forceAudio = () => { 
          unmute(); 
          window.removeEventListener('touchstart', forceAudio); 
        };
        window.addEventListener('touchstart', forceAudio);
      }

      (setVideoPool as any)(allVideos, target);
    }
  }, [data, mounted, searchParams, setVideoPool, isMuted, toggleMute, unmute]);