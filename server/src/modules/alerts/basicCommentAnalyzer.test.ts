import { BasicCommentAnalyzer } from './basicCommentAnalyzer';
import { describeCommentAnalyzer } from './commentAnalyzer.contract';

describeCommentAnalyzer('BasicCommentAnalyzer', () => new BasicCommentAnalyzer());
