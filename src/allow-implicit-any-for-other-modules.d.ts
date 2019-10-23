/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// https://github.com/amzn/ion-hash-js/issues/7
//
// this file exists to work-around the following tsc error:
//
//    ../ion-js.development/dist/commonjs/es6/IonLongInt.d.ts(1,28): error TS7016: Could not find a declaration file for module './BigInteger'. '/Volumes/Unix/dev/ion/ion-js.development/dist/commonjs/es6/BigInteger.js' implicitly has an 'any' type.
//
// once that's addressed, consider removing this file
//
declare module '*';

