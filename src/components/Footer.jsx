import styled from 'styled-components'


const Bar = styled.footer`
height: 40px; display:flex; align-items:center; justify-content:center;
border-top: 1px solid ${({ theme }) => theme.colors.border};
background: ${({ theme }) => theme.colors.panel};
`
export default function Footer(){
return <Bar>© {new Date().getFullYear()} • Powered by dtonsofts.com</Bar>
}