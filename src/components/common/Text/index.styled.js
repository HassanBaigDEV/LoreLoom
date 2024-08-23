import styled from "styled-components";

export const StyledText = styled.span`
  display: flex;
  justify-content: ${(props) => props.alignment || "center"};
  align-items: center;
  color: ${(props) => props.color || "#212529"};
  font-weight: ${(props) => props.weight || 400};
  font-size: ${(props) => props.size || 14}px;
  text-align: ${(props) => props.alignment || "center"};
  cursor: ${(props) => (props.link ? "pointer" : "normal")};
  margin: ${(props) => (props.margin ? props.margin : 0)};
`;
