/// <reference path="D:/dev/env/justlog/resources/article.d.ts" />

import React from '#react';
import { bar } from './test-import';
import './test-css.css';
import './test-scss.scss';
import imageSrc from './test-image.jpg';

const Button: React.FunctionComponent = () => {
    return <button></button>;
};

console.log(bar);
console.log(imageSrc);

function blog(): Blog {
    return {
        ...{
            uuid: '8c90c1d3-3afe-4404-ad2b-2f34c97e071c',
            copyright: 'CC BY-ND 4.0',
            topics: ['rust', 'net'],
            lang: '简体中文',
            bgImage: '',
            title: '博客标题',
        },
        content: (
            <div>
                <h1>博客标题</h1>
                <p>博客内容</p>
                <p>
                    <em>斜体</em> <strong>粗体</strong>{' '}
                    <em>
                        <strong>斜粗体</strong>
                    </em>{' '}
                    <sub>删除线</sub> <mark>强调</mark>{' '}
                    <span className="katex">
                        <span className="katex-mathml">
                            <math xmlns="http://www.w3.org/1998/Math/MathML">
                                <semantics>
                                    <mrow>
                                        <mi>S</mi>
                                        <mo>=</mo>
                                        <mi>π</mi>
                                        <msup>
                                            <mi>r</mi>
                                            <mn>2</mn>
                                        </msup>
                                    </mrow>
                                    <annotation encoding="application/x-tex">
                                        S=\pi r^2
                                    </annotation>
                                </semantics>
                            </math>
                        </span>
                        <span className="katex-html" aria-hidden="true">
                            <span className="base">
                                <span
                                    className="strut"
                                    style={{ height: '0.68333em', verticalAlign: '0em' }}
                                />
                                <span
                                    className="mord mathnormal"
                                    style={{ marginRight: '0.05764em' }}
                                >
                                    S
                                </span>
                                <span
                                    className="mspace"
                                    style={{ marginRight: '0.2777777777777778em' }}
                                />
                                <span className="mrel">=</span>
                                <span
                                    className="mspace"
                                    style={{ marginRight: '0.2777777777777778em' }}
                                />
                            </span>
                            <span className="base">
                                <span
                                    className="strut"
                                    style={{
                                        height: '0.8141079999999999em',
                                        verticalAlign: '0em',
                                    }}
                                />
                                <span
                                    className="mord mathnormal"
                                    style={{ marginRight: '0.03588em' }}
                                >
                                    π
                                </span>
                                <span className="mord">
                                    <span
                                        className="mord mathnormal"
                                        style={{ marginRight: '0.02778em' }}
                                    >
                                        r
                                    </span>
                                    <span className="msupsub">
                                        <span className="vlist-t">
                                            <span className="vlist-r">
                                                <span
                                                    className="vlist"
                                                    style={{
                                                        height: '0.8141079999999999em',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            top: '-3.063em',
                                                            marginRight: '0.05em',
                                                        }}
                                                    >
                                                        <span
                                                            className="pstrut"
                                                            style={{ height: '2.7em' }}
                                                        />
                                                        <span className="sizing reset-size6 size3 mtight">
                                                            <span className="mord mtight">
                                                                2
                                                            </span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            </span>
                        </span>
                    </span>
                </p>
                <p className="katex-block">
                    <span className="katex-display">
                        <span className="katex">
                            <span className="katex-mathml">
                                <math
                                    xmlns="http://www.w3.org/1998/Math/MathML"
                                    display="block"
                                >
                                    <semantics>
                                        <mrow>
                                            <mi>E</mi>
                                            <mo>=</mo>
                                            <mi>m</mi>
                                            <msup>
                                                <mi>c</mi>
                                                <mn>2</mn>
                                            </msup>
                                        </mrow>
                                        <annotation encoding="application/x-tex">
                                            E=mc^2
                                        </annotation>
                                    </semantics>
                                </math>
                            </span>
                            <span className="katex-html" aria-hidden="true">
                                <span className="base">
                                    <span
                                        className="strut"
                                        style={{
                                            height: '0.68333em',
                                            verticalAlign: '0em',
                                        }}
                                    />
                                    <span
                                        className="mord mathnormal"
                                        style={{ marginRight: '0.05764em' }}
                                    >
                                        E
                                    </span>
                                    <span
                                        className="mspace"
                                        style={{ marginRight: '0.2777777777777778em' }}
                                    />
                                    <span className="mrel">=</span>
                                    <span
                                        className="mspace"
                                        style={{ marginRight: '0.2777777777777778em' }}
                                    />
                                </span>
                                <span className="base">
                                    <span
                                        className="strut"
                                        style={{
                                            height: '0.8641079999999999em',
                                            verticalAlign: '0em',
                                        }}
                                    />
                                    <span className="mord mathnormal">m</span>
                                    <span className="mord">
                                        <span className="mord mathnormal">c</span>
                                        <span className="msupsub">
                                            <span className="vlist-t">
                                                <span className="vlist-r">
                                                    <span
                                                        className="vlist"
                                                        style={{
                                                            height: '0.8641079999999999em',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                top: '-3.113em',
                                                                marginRight: '0.05em',
                                                            }}
                                                        >
                                                            <span
                                                                className="pstrut"
                                                                style={{
                                                                    height: '2.7em',
                                                                }}
                                                            />
                                                            <span className="sizing reset-size6 size3 mtight">
                                                                <span className="mord mtight">
                                                                    2
                                                                </span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            </span>
                        </span>
                    </span>
                </p>
                <table>
                    <thead>
                        <tr>
                            <th>Column A</th>
                            <th style={{ textAlign: 'right' }}>Column B</th>
                            <th>Column C</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td rowSpan={2}>A1</td>
                            <td style={{ textAlign: 'right' }}>B1</td>
                            <td>C1</td>
                        </tr>
                        <tr>
                            <td style={{ textAlign: 'right' }} colSpan={2}>
                                B2
                            </td>
                        </tr>
                        <tr>
                            <td>A3</td>
                            <td style={{ textAlign: 'right' }}>B3</td>
                            <td>C3</td>
                        </tr>
                    </tbody>
                </table>
                <pre>
                    <code className="py">
                        def foo(i: int):{'\n'}
                        {'    '}return i + 1{'\n'}
                    </code>
                </pre>
                <Button />
            </div>
        ),
    };
}
registerBlog({
    ...blog(),
    ...{
        // 在这里扩展 Blog 对象...
    },
});
