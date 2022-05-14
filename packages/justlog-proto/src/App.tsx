import React from 'react';
import './shell.scss';
import './blog.scss';

interface AppProps {
    callback?: (app: App) => void;
}

export default class App extends React.Component<AppProps> {
    blog: Blog | undefined = void 0;
    componentDidMount() {
        if (this.props.callback) {
            this.props.callback(this);
        }
    }
    installBlog(blog: Blog): void {
        this.blog = blog;
        this.forceUpdate();
    }
    render(): React.ReactNode {
        return (
            <div className="App">
                <div className="blog-shell">{this.blog && this.blog.content}</div>
            </div>
        );
    }
}
