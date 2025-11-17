import React, { CSSProperties } from 'react';
import { LowerThirdConfig } from './types';


interface ProfessionalLowerThirdProps {
  config: LowerThirdConfig;
}


const ProfessionalLowerThird: React.FC<ProfessionalLowerThirdProps> = ({ config }) => {
  const darken = (color: string, percent: number): string => {
    try {
      let num = parseInt(color.replace('#', ''), 16);
      let amt = Math.round(2.55 * percent);
      let R = (num >> 16) - amt;
      let G = ((num >> 8) & 0x00ff) - amt;
      let B = (num & 0x0000ff) - amt;
      const newColor =
        '#' +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1);
      return newColor;
    } catch (e) {
      return color;
    }
  };


  const topBarStyle = {
    background: `linear-gradient(135deg, ${config.accentColor} 0%, ${darken(
      config.accentColor,
      20
    )} 50%, ${config.accentColor} 100%)`,
  };


  const diamondStyle = {
    background: `linear-gradient(135deg, ${config.accentColor} 0%, ${darken(
      config.accentColor,
      10
    )} 30%, ${darken(config.accentColor, 20)} 70%, ${darken(
      config.accentColor,
      40
    )} 100%)`,
  };


  const mainBarStyle = {
    background: `linear-gradient(135deg, ${config.mainBarColor} 0%, ${darken(
      config.mainBarColor,
      5
    )} 30%, ${darken(config.mainBarColor, 10)} 70%, ${darken(
      config.mainBarColor,
      15
    )} 100%)`,
     color: darken(config.mainBarColor, 90)
  };
   const mainTextStyle = {
    color: Math.abs(parseInt(darken(config.mainBarColor, 90).replace('#', ''), 16) - parseInt(config.mainBarColor.replace('#', ''), 16)) > 0x555555 
        ? darken(config.mainBarColor, 90)
        : darken(config.mainBarColor, 10)
  };



  const wrapperStyle: CSSProperties = {
    ['--lower-third-scale' as any]: config.scale ?? 1,
  };

  return (
    <>
      <style>{`
        .lower-third-wrapper {
            position: absolute;
            bottom: 10%;
            left: 0;
            width: 100%;
            max-width: none;
            perspective: 1000px;
            /* scaleX fixed at 1 so width stays full; scaleY controlled by slider */
            transform: scale(1, var(--lower-third-scale, 1));
            transform-origin: bottom left;
        }


        .lower-third {
            position: relative;
            width: 100%;
            height: 160px;
            transform-style: preserve-3d;
            animation: slideInLeft 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }


        .top-bar {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 65px;
            clip-path: polygon(0 0, 97% 0, 100% 100%, 0 100%);
            box-shadow: 
                0 4px 20px rgba(211, 47, 47, 0.5),
                inset 0 1px 0 rgba(255,255,255,0.2);
            z-index: 5;
            overflow: hidden;
        }


        .top-bar::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -100%;
            width: 50%;
            height: 200%;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,0.3) 50%, 
                transparent 100%);
            animation: shine 3s infinite;
        }


        .top-text {
            position: absolute;
            top: 50%;
            left: 180px;
            transform: translateY(-50%);
            color: #ffffff;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 8px;
            text-transform: uppercase;
            text-shadow: 
                0 2px 10px rgba(0,0,0,0.5),
                0 0 20px rgba(255,255,255,0.3);
            animation: fadeIn 0.8s 0.5s both;
        }


        .main-bar {
            position: absolute;
            top: 65px;
            left: 0;
            width: 100%;
            height: 95px;
            clip-path: polygon(0 0, 97% 0, 100% 100%, 0 100%);
            box-shadow: 
                0 8px 32px rgba(0,0,0,0.3),
                inset 0 1px 0 rgba(255,255,255,0.8),
                inset 0 -1px 0 rgba(0,0,0,0.1);
            z-index: 4;
            overflow: hidden;
        }
        
        .main-text {
            position: absolute;
            top: 50%;
            left: 180px;
            transform: translateY(-50%);
            font-size: 38px;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
            text-shadow: 
                1px 1px 0 rgba(255,255,255,0.8),
                2px 2px 4px rgba(0,0,0,0.2);
            animation: fadeIn 0.8s 0.7s both;
        }


        .side-tab {
            position: absolute;
            top: 65px;
            left: -40px;
            width: 120px;
            height: 95px;
            background: linear-gradient(135deg, 
                #ffffff 0%, 
                #f0f0f0 50%,
                #e0e0e0 100%);
            clip-path: polygon(35% 0, 100% 0, 100% 100%, 0 100%);
            box-shadow: 
                -5px 5px 15px rgba(0,0,0,0.3),
                inset 1px 0 0 rgba(255,255,255,0.5);
            z-index: 3;
        }


        .logo-wrapper {
            position: absolute;
            top: 50%;
            left: 40px;
            transform: translateY(-50%);
            width: 110px;
            height: 110px;
            z-index: 10;
            animation: logoZoom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }


        .diamond-outer {
            position: absolute;
            width: 110px;
            height: 110px;
            transform: rotate(45deg);
            box-shadow: 
                0 12px 40px rgba(211, 47, 47, 0.6),
                inset -3px -3px 8px rgba(0,0,0,0.4),
                inset 3px 3px 8px rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.1);
        }


        .diamond-inner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90px;
            height: 90px;
            background: linear-gradient(135deg, 
                rgba(255,255,255,0.1) 0%, 
                transparent 100%);
        }


        .logo-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 72px;
            height: 72px;
            border-radius: 50%;
            overflow: hidden;
            z-index: 11;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: #ffffff;
        }


        @keyframes slideInLeft {
            0% { transform: translateX(-120%) rotateY(20deg); opacity: 0; }
            100% { transform: translateX(0) rotateY(0deg); opacity: 1; }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-50%) translateX(-20px); }
            to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes logoZoom {
            0% { transform: translateY(-50%) scale(0) rotate(180deg); opacity: 0; }
            100% { transform: translateY(-50%) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 200%; }
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.9; }
        }
        
        /* Light positional tweak on very small screens */
        @media (max-width: 640px) {
            .lower-third-wrapper {
                bottom: 6%;
            }
        }
      `}</style>
      <div className="lower-third-wrapper" style={wrapperStyle}>
        <div className="lower-third">
          <div className="top-bar" style={topBarStyle}>
            <div className="top-text">{config.topText}</div>
          </div>


          <div className="main-bar" style={mainBarStyle}>
            <div className="main-text" style={mainTextStyle}>{config.mainText}</div>
          </div>


          <div className="side-tab" style={{ background: `linear-gradient(135deg, ${config.mainBarColor} 0%, ${darken(config.mainBarColor, 5)} 50%, ${darken(config.mainBarColor, 10)} 100%)`}}></div>


          <div className="logo-wrapper">
            <div className="diamond-outer" style={diamondStyle}>
              <div className="diamond-inner"></div>
            </div>
            <div className="logo-icon">
              <span>{config.logoIcon || '✝'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


export default ProfessionalLowerThird;
