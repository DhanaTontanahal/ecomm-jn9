import { createGlobalStyle } from 'styled-components'


const GlobalStyle = createGlobalStyle`
*{ box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
margin: 0;
background: ${({ theme }) => theme.colors.bg};
color: ${({ theme }) => theme.colors.text};
font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
}
a{ color: inherit; text-decoration: none; }
`
export default GlobalStyle