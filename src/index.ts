import invariant from 'invariant';
import { oneLine } from 'common-tags';
import isNoid from './utils/isNoid';
import { NextFunction } from 'express';

const NODE_ENV = process.env.NODE_ENV;

/**
 * Return rest error handler factory.
 * The factory returns a function accepts four arguments.
 * This is a standard Connect error middleware.
 */
export default function restErrorHandlerFactory() {
  return function restErrorHandler(err: any, _req: any, res: any, next: NextFunction) {
    /**
     * Delegate to the default error handling mechanisms in Express,
     * when the headers have already been sent to the client.
     */
    if (res.headersSent === true) return next(err);

    // If err.status is not defined, it is not what we would expect, call next middleware.
    if (err !== Object(err) || typeof err.status !== 'number') {
      return next(err);
    }

    switch (err.status) {
      /**
       * HTTP Status Code 400 Bad Request. 类型400: 请求参数错误
       */
      case 400: {
        const {
          /**
           * Define which field is invalid.
           */
          field,
          /**
           * Override details.message.
           */
          fieldMessage,
          /**
           * Override error message.
           */
          message,
        }: {
          field: string;
          fieldMessage: string;
          message: string;
        } = err;

        return res.status(400).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message: isNoid(message) ? 'Invalid request parameter.' : message,
          /**
           * Error detail. 详细报错信息
           */
          details: [{
            /**
             * Bad request field. 出错字段名
             */
            field,
            /**
             * Detailed error message relative to this field. 该字段人类可读报错信息
             */
            message: isNoid(fieldMessage) ? `${field} is invalid` : fieldMessage,
          }],
        });
      }
      /**
       * HTTP Status Code 401 Unauthorized. 类型401: 未经授权(未登录)
       */
      case 401: {
        const {
          /**
           * Override error message.
           */
          message,
        }: {
          message: string;
        } = err;

        return res.status(401).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message: isNoid(message) ? 'Invalid credentials' : message,
        });
      }
      /**
       * HTTP Status Code 403 Forbidden. 类型403: 权限不足
       */
      case 403: {
        const {
          /**
           * Override error message.
           */
          message,
        }: {
          message: string;
        } = err;

        return res.status(403).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message: isNoid(message) ? 'Insufficient authority' : message,
        });
      }
      /**
       * HTTP Status Code 404 Not Found. 类型404: 未找到
       */
      case 404: {
        const {
          /**
           * Override error message.
           */
          message,
        }: {
          message: string;
        } = err;

        return res.status(404).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message: isNoid(message) ? 'Not Found' : message,
        });
      }
      /**
       * HTTP Status Code 422 Unprocessable Entity. 类型422: 执行错误
       */
      case 422: {
        const {
          details = [],
          /**
           * Override error message.
           */
          message,
        }: {
          details: {
            code: 'already_exists' | 'invalid' | 'missing' | 'missing_field';
            field: string;
            resource: string;
          }[];
          message: string;
        } = err;

        if (NODE_ENV !== 'production') {
          /**
           * Must define error details property.
           */
          invariant(details.length !== 0, 'Error details must be defined.');

          /**
           * Error details property has strict validation rules.
           */
          details.forEach(({ code, field, resource }) => {
            /**
             * validate that details property contains { code, field, resource }.
             */
            invariant(!isNoid(code), 'Error details.code is missing.');
            invariant(!isNoid(field), 'Error details.field is missing.');
            invariant(!isNoid(resource), 'Error details.resource is missing.');

            /**
             * already_exists:
             * This means another resource has the same value as this field.
             * This can happen in resources that must have some unique key (such as Label names).
             * invalid:
             * This means the formatting of a field is invalid. The documentation for that resource
             * should be able to give you more specific information.
             * missing:
             * This means a resource does not exist.
             * missing_field:
             * This means a required field on a resource has not been set.
             */
            invariant(
              ['already_exists', 'invalid', 'missing', 'missing_field'].includes(code),
              oneLine`
                Received details.code: ${code}.
                It must be one of ['already_exists', 'invalid', 'missing', 'missing_field'].
              `,
            );
          });
        }

        return res.status(422).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message,
          /**
           * Error details. Containing three properties only: { code, field, resource }.
           * 详细错误信息。只包含三个字端：code, field 和 resource
           */
          details,
        });
      }
      /**
       * HTTP Status Code 500 Internal Server Error. 类型500: 服务器内部错误
       */
      case 500: {
        const {
          /**
           * Override error message.
           */
          message,
        }: {
          message: string;
        } = err;

        return res.status(500).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message: isNoid(message) ? 'Internal Server Error' : message,
        });
      }
      /**
       * All other errors come into this handler.
       */
      default: {
        const {
          /**
           * Override error message.
           */
          message,
        }: {
          message: string;
        } = err;

        return res.status(err.status).json({
          /**
           * Human readable error message. 人类可读报错信息
           */
          message: isNoid(message) ? '' : message,
        });
      }
    }
  };
}
