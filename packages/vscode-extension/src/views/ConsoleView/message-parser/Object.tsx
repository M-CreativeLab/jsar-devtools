import * as React from 'react';
import { withTheme } from 'emotion-theming';
import type { Options } from 'linkifyjs';
import * as linkify from 'linkifyjs/react';
const Linkify = linkify.default as any;

import { Theme } from '../definitions/component';
import { Root } from '../elements';
import { Message } from '../definitions/component';
import Inspector from '../inspector';

interface Props {
  log: Message
  quoted: boolean
  theme?: Theme
  linkifyOptions?: Options
}

class ObjectTree extends React.PureComponent<Props, any> {
  render() {
    const { theme, quoted, log } = this.props

    return log.data.map((message: any, i: number) => {
      if (typeof message === 'string') {
        const string =
          !quoted && message.length ? (
            `${message} `
          ) : (
            <span>
              <span>"</span>
              <span
                style={{
                  color: theme.styles.OBJECT_VALUE_STRING_COLOR,
                }}
              >
                {message}
              </span>
              <span>" </span>
            </span>
          )

        return (
          <Root data-type="string" key={i}>
            <Linkify options={this.props.linkifyOptions}>{string}</Linkify>
          </Root>
        )
      }

      return <Inspector data={message} key={i} />
    })
  }
}

export default withTheme(ObjectTree);
