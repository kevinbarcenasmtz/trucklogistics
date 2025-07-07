// types/global.d.ts
/// <reference types="react" />

declare global {
    // eslint-disable-next-line no-var
    var RNFB_MODULAR_DEPRECATION_STRICT_MODE: boolean;
    
    namespace JSX {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface Element extends React.ReactElement<any, any> {}
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface ElementClass extends React.Component<any> {}
      interface ElementAttributesProperty {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        props: {};
      }
      interface ElementChildrenAttribute {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        children: {};
      }
    }
  }
  
  export {};