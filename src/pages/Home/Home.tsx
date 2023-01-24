import { NavLink } from "react-router-dom";
import './Home.css'

interface CardProps {
  title: string
  description: string
};

function Card(props: CardProps) {
  return <div className="function-card">
    <div className="function-card-content">
      <div className="function-card-bg-mask"/>
      <div>
        <p>{props.title}</p>
      </div>
    </div>
  </div>
}

export function Home() {
  return <div>
    <span>233</span>
    <Card title="text" description="233"/>
    <NavLink to="/canvas">to canvas</NavLink>
    <NavLink to="/video">to video</NavLink>
  </div>
}