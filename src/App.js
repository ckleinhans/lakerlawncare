import { Route, Switch } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Switch>
      <Route exact path="/">
        <div>
          You have reached the homepage. It is currently under construction.
        </div>
      </Route>
    </Switch>
  );
}

export default App;