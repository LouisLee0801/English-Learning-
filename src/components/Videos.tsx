import type { VideoRef } from '../data/types';

export default function Videos({ videos }: { videos: VideoRef[] }) {
  if (videos.length === 0) {
    return <p className="section-hint">此單元的影片正在補充中。</p>;
  }
  return (
    <div className="video-list">
      <p className="section-hint">
        🎬 精選真實影片（3–8 分鐘）。先看「觀看重點」再播放，注意聽這些句子怎麼被說出來。
      </p>
      {videos.map((v) => (
        <div key={v.youtubeId} className="video-card">
          <div className="video-embed">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
              title={v.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="video-info">
            <h3>{v.title}</h3>
            <div className="video-meta">
              {v.channel}
              {v.year ? `・${v.year}` : ''}
              {v.duration ? `・${v.duration}` : ''}
            </div>
            <p className="video-why">{v.whyWatch}</p>
            <div className="listen-for">
              <h4>👂 觀看重點</h4>
              <ul>
                {v.listenFor.map((item, i) => (
                  <li key={i}>
                    <span className="lf-en">{item.en}</span>
                    <span className="lf-zh">{item.zh}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
