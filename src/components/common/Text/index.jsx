"use client";
import { StyledText } from "./index.styled";

const SpanText = ({ children, ...rest }) => {
  //  Props needs to be passed to this commponent (if required)
  // size (font size [number])
  // color (text color [string])
  // alignment (text alignment [string])
  return <StyledText {...rest}>{children}</StyledText>;
};

export default SpanText;
