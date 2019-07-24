// this file exists to work-around the following tsc error:
//
//    ../ion-js.development/dist/commonjs/es6/IonLongInt.d.ts(1,28): error TS7016: Could not find a declaration file for module './BigInteger'. '/Volumes/Unix/dev/ion/ion-js.development/dist/commonjs/es6/BigInteger.js' implicitly has an 'any' type.
//
// once that's addressed, consider removing this file
//
declare module '*';

