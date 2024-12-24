// Loading.jsx

import React from 'react';

//const [isLoading, setIsLoading] = useState(false);
//最后</div>前::   {isLoading && <Loading />}
const Loading = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default Loading;
